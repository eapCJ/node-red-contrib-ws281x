# Contributing to node-red-contrib-ws281x

🎉 **Thank you for taking the time to contribute!** Your help is very welcome—whether it's a bug report, feature request, documentation update, test case or pull-request.

This project follows **Test-Driven Development**. All code changes **must** be covered by meaningful unit tests and pass our automated CI workflow.

---

## 📋 Prerequisites

1. **Node.js ≥ 14** (Node-RED 4.x LTS)
2. **npm ≥ 8**
3. A Raspberry Pi is required to _run_ the node against real hardware, but is **not** required to develop or run the unit-tests—they use a stub driver.

---

## 🚀 Getting Started

1. **Fork** this repo & clone your fork.
2. Install dependencies:

    ```bash
    npm install
    ```

3. Run the test-watcher while you work:

    ```bash
    npm test -- --watch
    ```

4. (Optional) Run Node-RED _from your checkout_ to test the nodes in the editor:

    ```bash
    npx node-red -u $(pwd) --safe
    ```

---

## 🧑‍💻 Development Workflow

1. Create a feature branch from `main`—please use the **conventional commits** style for the branch name and commits (e.g. `feat/pwm-default-brightness`).
2. **Write a failing test** that demonstrates the bug or missing feature.
3. Implement the change ✨ and make the test pass.
4. Ensure **all** tests, linter and Prettier pass:

    ```bash
    npm run lint && npm test
    ```

5. Submit a Pull Request against `main`. CI must be green before merging.

---

## 🛠️ Useful npm Scripts

| Script           | Description                 |
| ---------------- | --------------------------- |
| `npm test`       | Run Mocha test-suite        |
| `npm run lint`   | Run ESLint + Prettier rules |
| `npm run format` | Auto-format using Prettier  |

---

## 🗂️ Project Structure

```
root
├── nodes/               # Node-RED node implementations & HTML
├── lib/                 # Shared runtime helpers
├── test/                # Mocha unit tests (stub driver)
├── .github/workflows/   # GitHub Actions CI definitions
└── examples/            # (Optional) example flows
```

---

## 📜 Code Style

- **ESLint** + **Prettier** enforce a strict, opinionated style—**CI will fail** if code isn't formatted.
- Keep files **≤ 250 LOC** as per project guideline.
- Follow the **Single Responsibility Principle (SRP)**.

---

## 📝 Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/) for readable history and automatic changelog generation.

Examples:

```
fix(output): handle zero-length payload without crashing
feat(config): add support for GRB LED ordering
```

---

## 🛡️ Code of Conduct

By participating you agree to abide by the [Contributor Covenant](CODE_OF_CONDUCT.md).

If you witness or experience unacceptable behavior, please reach out at **eusebiu.plesa@gmail.com**.

---
