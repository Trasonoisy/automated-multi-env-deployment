# Automated Multi-Environment Deployment Pipeline

A simple Node.js and Express web application used to practice a multi-environment CI/CD pipeline with Docker, GitHub Actions, GitHub Container Registry, and SSH-based deployment.

## Current Phase

Phase 1: Minimal demo application.

## Tech Stack

- Node.js
- Express
- Jest
- Supertest

## Application Endpoints

### GET /

Returns basic application information.

Example response:

```json
{
  "message": "Automated Multi-Environment Deployment Pipeline",
  "environment": "development"
}