from __future__ import annotations

import json
from pathlib import Path

import numpy as np
from sklearn.datasets import fetch_openml
from sklearn.metrics import accuracy_score
from sklearn.neural_network import MLPClassifier


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUTPUT_PATH = DATA_DIR / "mnist_model.js"


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

    x_train_scaled = x_train / 255.0
    x_test_scaled = x_test / 255.0

    classifier = MLPClassifier(
        hidden_layer_sizes=(128, 64),
        activation="relu",
        solver="adam",
        alpha=1e-4,
        batch_size=256,
        learning_rate_init=1e-3,
        max_iter=20,
        early_stopping=True,
        n_iter_no_change=4,
        validation_fraction=0.1,
        random_state=42,
        verbose=True,
    )
    classifier.fit(x_train_scaled, y_train)

    test_predictions = classifier.predict(x_test_scaled)
    test_accuracy = accuracy_score(y_test, test_predictions)

    sample_pool, digit_examples = select_samples(x_test, y_test)

    export = {
        "meta": {
            "dataset": "MNIST",
            "trainSamples": int(x_train.shape[0]),
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
