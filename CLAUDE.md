# Clairvoyant - Claude Code Guidelines

## Git / Push Policy

**Never push changes automatically.** After making any code changes, tell the user what was changed and provide the exact git commands to push manually. Example:

```bash
git add .
git commit -m "your message"
git push
```

## Project Overview

Clairvoyant is an AI-powered video search engine. The frontend lives in `clairvoyantcrimewatch/` (React + TypeScript + Vite + shadcn-ui). The backend is being built as a Python FastAPI service.
