# Marketplace Research Lab

**Version:** 0.1 MVP

Marketplace Research Lab is a local-first desktop application designed to research products from Redbubble for a given keyword and generate an AI-powered HTML research report.

This repository is specification-driven. The project documentation is the authoritative source for all implementation decisions.

Before implementing any code, read the documentation in the order listed below.

---

# Documentation Reading Order

## 000 — AI Development Instructions

Read this document first.

It defines how AI coding assistants must work throughout the project and establishes the implementation rules that must be followed.

---

## 001 — Project Vision & Product Scope

Defines the project's purpose, goals, scope, constraints, and Version 0.1 boundaries.

---

## 002 — Architecture Principles & Design Philosophy

Defines the architectural principles, design philosophy, and engineering guidelines that govern the project.

---

## 003 — High-Level System Architecture

Explains the overall system architecture, major components, data flow, and responsibilities.

---

## 004 — Domain Model & Core Entities

Defines the core business entities and their relationships.

---

## 005 — Project Structure & Module Boundaries

Defines the project folder structure and the responsibilities of each module.

---

## 006 — Technology Stack Decisions

Defines the approved technology stack for Version 0.1.

---

## 007 — Database Design

Defines the SQLite database schema, relationships, constraints, and persistence model.

---

## 008 — Data Collection Pipeline

Defines the complete workflow for collecting structured product data from Redbubble.

---

## 009 — AI Analysis Pipeline

Defines how collected marketplace data is prepared, analyzed by the AI provider, validated, and stored.

---

## 010 — Report Generation System

Defines how the final standalone HTML research report is generated.

---

## 011 — Configuration & Environment

Defines the application configuration and local environment requirements.

---

## 012 — Logging & Error Handling

Defines logging behavior, error handling strategy, and recovery rules.

---

## 013 — Testing Strategy

Defines the testing approach for the application, including unit, integration, and end-to-end testing.

---

## 014 — Development Roadmap

Defines the recommended implementation phases for Version 0.1.

---

## 015 — Coding Standards & Conventions

Defines the coding standards, naming conventions, formatting rules, and implementation guidelines used throughout the project.

---

# Development Principles

All implementation must follow the project documentation.

The documentation is the single source of truth.

Implementation should remain within the approved Version 0.1 scope.

Do not introduce undocumented features, modules, workflows, or architectural changes.

If required information is missing from the documentation, implementation should stop until clarification is provided.

---

# Version 0.1 Workflow

The application implements the following workflow:

```text
User enters a keyword

↓

Search Redbubble

↓

Collect top products

↓

Extract structured product data

↓

Store collected data

↓

Run AI analysis

↓

Generate HTML research report
```

This workflow defines the complete scope of Marketplace Research Lab Version 0.1.

---

# Implementation Rule

Always begin by reading the documentation in the order defined above.

Only after the relevant documents have been understood should implementation begin.
# Marketplace-Research-Lab
