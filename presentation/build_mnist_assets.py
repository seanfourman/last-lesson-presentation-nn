from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from scipy import ndimage
from sklearn.datasets import fetch_openml
from sklearn.metrics import accuracy_score
from sklearn.neural_network import MLPClassifier


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUT_PATH = DATA_DIR / "mnist_model.js"


def fit_image_to_canvas(image: np.ndarray, size: int = 28) -> np.ndarray:
    """Center-crop or center-pad a transformed digit back into a square canvas."""
    height, width = image.shape
    output = np.zeros((size, size), dtype=np.float32)

    copy_height = min(size, height)
    copy_width = min(size, width)
    source_y = max(0, (height - size) // 2)
    source_x = max(0, (width - size) // 2)
    target_y = max(0, (size - height) // 2)
    target_x = max(0, (size - width) // 2)

    output[target_y : target_y + copy_height, target_x : target_x + copy_width] = image[
        source_y : source_y + copy_height,
        source_x : source_x + copy_width,
    ]
    return output


def augment_digit(image: np.ndarray, rng: np.random.Generator) -> np.ndarray:
    """Synthesize hand-drawn variation while keeping the digit MNIST-like."""
    digit = image.reshape(28, 28).astype(np.float32) / 255.0

    angle = float(rng.uniform(-18.0, 18.0))
    transformed = ndimage.rotate(
        digit,
        angle,
        reshape=False,
        order=1,
        mode="constant",
        cval=0.0,
        prefilter=False,
    )

    scale = float(rng.uniform(0.82, 1.16))
    zoomed = ndimage.zoom(transformed, scale, order=1, mode="constant", prefilter=False)
    transformed = fit_image_to_canvas(zoomed)

    shift = rng.uniform(-3.2, 3.2, size=2)
    transformed = ndimage.shift(
        transformed,
        shift=shift,
        order=1,
        mode="constant",
        cval=0.0,
        prefilter=False,
    )

    if rng.random() < 0.45:
        sigma = float(rng.uniform(0.25, 0.9))
        transformed = ndimage.gaussian_filter(transformed, sigma=sigma)

    if rng.random() < 0.35:
        transformed = ndimage.grey_dilation(transformed, size=(2, 2))
    elif rng.random() < 0.15:
        transformed = ndimage.grey_erosion(transformed, size=(2, 2))

    gamma = float(rng.uniform(0.82, 1.22))
    transformed = np.clip(transformed, 0.0, 1.0) ** gamma
    transformed *= float(rng.uniform(0.92, 1.12))
    transformed += rng.normal(0.0, 0.012, size=transformed.shape).astype(np.float32)
    transformed = np.clip(transformed, 0.0, 1.0)
    return (transformed * 255.0).astype(np.float32).reshape(-1)


def build_augmented_training_split(
    x_train: np.ndarray,
    y_train: np.ndarray,
    *,
    per_class: int = 1500,
    seed: int = 42,
) -> tuple[np.ndarray, np.ndarray]:
    rng = np.random.default_rng(seed)
    augmented_images: list[np.ndarray] = []
    augmented_labels: list[np.ndarray] = []

    for digit in range(10):
        indices = np.flatnonzero(y_train == digit)
        chosen = rng.choice(indices, size=per_class, replace=False)
        augmented_images.extend(augment_digit(x_train[idx], rng) for idx in chosen)
        augmented_labels.append(np.full(per_class, digit, dtype=np.int64))

    x_augmented = np.stack(augmented_images).astype(np.float32)
    y_augmented = np.concatenate(augmented_labels)
    return x_augmented, y_augmented


def select_samples(x_test: np.ndarray, y_test: np.ndarray) -> tuple[list[dict], dict[str, list[int]]]:
    rng = np.random.default_rng(42)
    sample_pool: list[dict] = []
    digit_examples: dict[str, list[int]] = {}

    for digit in range(10):
        indices = np.flatnonzero(y_test == digit)
        rng.shuffle(indices)
        chosen = indices[:12]
        if chosen.size == 0:
            continue

        digit_examples[str(digit)] = x_test[chosen[0]].astype(np.uint8).tolist()
        for idx in chosen:
            sample_pool.append(
                {
                    "label": int(y_test[idx]),
                    "pixels": x_test[idx].astype(np.uint8).tolist(),
                }
            )

    rng.shuffle(sample_pool)
    return sample_pool, digit_examples


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    x, y = fetch_openml("mnist_784", version=1, return_X_y=True, as_frame=False)
    x = x.astype(np.float32)
    y = y.astype(np.int64)

    x_train, x_test = x[:60000], x[60000:]
    y_train, y_test = y[:60000], y[60000:]

    x_augmented, y_augmented = build_augmented_training_split(x_train, y_train)
    x_train_full = np.concatenate([x_train, x_augmented], axis=0)
    y_train_full = np.concatenate([y_train, y_augmented], axis=0)

    x_train_scaled = x_train_full / 255.0
    x_test_scaled = x_test / 255.0

    classifier = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        alpha=8e-5,
        batch_size=256,
        learning_rate_init=1e-3,
        max_iter=24,
        early_stopping=True,
        n_iter_no_change=5,
        validation_fraction=0.1,
        random_state=42,
        verbose=True,
    )
    classifier.fit(x_train_scaled, y_train_full)

    test_predictions = classifier.predict(x_test_scaled)
    test_accuracy = accuracy_score(y_test, test_predictions)

    sample_pool, digit_examples = select_samples(x_test, y_test)

    export = {
        "meta": {
            "dataset": "MNIST",
            "trainSamples": int(x_train.shape[0]),
            "augmentedSamples": int(x_augmented.shape[0]),
            "testSamples": int(x_test.shape[0]),
            "testAccuracy": round(float(test_accuracy), 6),
            "epochs": int(classifier.n_iter_),
            "architecture": [784, 128, 64, 10],
            "lossCurve": [round(float(value), 6) for value in classifier.loss_curve_],
            "validationCurve": [
                round(float(value), 6) for value in (classifier.validation_scores_ or [])
            ],
            "parameterCount": int(
                sum(weights.size + bias.size for weights, bias in zip(classifier.coefs_, classifier.intercepts_))
            ),
        },
        "layers": [
            {
                "input": int(weights.shape[0]),
                "output": int(weights.shape[1]),
                "weights": np.round(weights.astype(np.float32).ravel(), 6).tolist(),
                "bias": np.round(bias.astype(np.float32), 6).tolist(),
            }
            for weights, bias in zip(classifier.coefs_, classifier.intercepts_)
        ],
        "samples": sample_pool,
        "digitExamples": digit_examples,
    }

    payload = "window.MNIST_MODEL = " + json.dumps(export, separators=(",", ":")) + ";\n"
    OUTPUT_PATH.write_text(payload, encoding="utf-8")

    print(f"Wrote {OUTPUT_PATH.name}")
    print(f"Test accuracy: {test_accuracy:.4%}")


if __name__ == "__main__":
    main()
