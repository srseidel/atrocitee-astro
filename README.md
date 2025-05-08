# Atrocitee - Threads of Change

Political t-shirts that donate profits to causes that matter. Every purchase makes a difference.

![Atrocitee](https://4480144f.atrocitee-astro.pages.dev/images/atrocitee-logo.svg)

## 🚀 Project Overview

Atrocitee is an e-commerce platform selling politically-themed t-shirts with a portion of every purchase going directly to associated charitable causes. Our mission is to empower people to wear their values while making a tangible impact.

## 🛠️ Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Deployment**: [Cloudflare Pages](https://pages.cloudflare.com/)
- **Database**: [Supabase](https://supabase.com/) (planned)
- **Authentication**: Supabase Auth (planned)

## 🔧 Local Development Setup

### Prerequisites

- Node.js (v16+)
- npm or pnpm
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:srseidel/atrocitee-astro.git
   cd atrocitee-astro
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. View the site at `http://localhost:4321`

## 🔄 CI/CD Process

Our project uses an automated CI/CD pipeline with GitHub and Cloudflare Pages:

### Continuous Integration

We use GitHub Actions to run automated checks on every pull request:
- Code linting
- Type checking
- Unit tests (planned)

### Continuous Deployment

**Preview Deployments:**
- Every pull request automatically generates a unique preview URL
- These preview deployments serve as our staging environments
- Team members can review changes in an isolated environment before merging

**Production Deployment:**
- When changes are merged to the `main` branch, they are automatically deployed to production
- Production site: [https://atrocitee-astro.pages.dev/](https://atrocitee-astro.pages.dev/)

## 📁 Project Structure

```
/
├── public/          # Static assets
├── src/
│   ├── components/  # UI components
│   ├── layouts/     # Page layouts
│   ├── pages/       # Page routes
│   ├── styles/      # CSS files
│   └── utils/       # Utility functions
├── Docs/            # Project documentation
└── .github/         # GitHub Actions workflows
```

## 🤝 Contributing

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. Make your changes and commit them:
   ```bash
   git commit -m "Add amazing feature"
   ```

3. Push to the branch:
   ```bash
   git push origin feature/amazing-feature
   ```

4. Open a pull request

5. Wait for the CI checks to pass and for the preview deployment to be ready

6. Once approved, merge your pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

```sh
npm create astro@latest -- --template basics
```

[![Open in StackBlitz](https://developer.stackblitz.com/img/open_in_stackblitz.svg)](https://stackblitz.com/github/withastro/astro/tree/latest/examples/basics)
[![Open with CodeSandbox](https://assets.codesandbox.io/github/button-edit-lime.svg)](https://codesandbox.io/p/sandbox/github/withastro/astro/tree/latest/examples/basics)
[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/withastro/astro?devcontainer_path=.devcontainer/basics/devcontainer.json)

> 🧑‍🚀 **Seasoned astronaut?** Delete this file. Have fun!

![just-the-basics](https://github.com/withastro/astro/assets/2244813/a0a5533c-a856-4198-8470-2d67b1d7c554)

## 🚀 Project Structure

Inside of your Astro project, you'll see the following folders and files:

```text
/
├── public/
│   └── favicon.svg
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       └── index.astro
└── package.json
```

To learn more about the folder structure of an Astro project, refer to [our guide on project structure](https://docs.astro.build/en/basics/project-structure/).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 👀 Want to learn more?

Feel free to check [our documentation](https://docs.astro.build) or jump into our [Discord server](https://astro.build/chat).
