# Loki Mode: Continuity & Working Memory

> **Purpose:** This file acts as the primary working memory across sessions. Loki Mode agents read this file first upon waking up.

---

## 🧭 Current Mission

**Objective:** Establishing persistent context and tracking for Loki Mode agents in the Smart Digital Office project.
**Current Phase:** Bootstrap

## 📋 Active Tasks

- [ ] Implement initial components for the smartdrop module
- [ ] Fix warnings and layout issues in the frontend

## 🧠 Mistakes & Learnings

_Record patterns, bugs, or anti-patterns discovered during development here to avoid repeating them._

1. React Router v7 future flags need to be added to BrowserRouter to avoid console warnings.
2. Fragment should not be used in table bodies directly if a key is needed for mapping; use `tbody` instead.

## 🏗️ Technical Constraints & Decisions

_Record architectural choices or constraints._

1. The project uses React, React Router, and TailwindCSS on the frontend.
2. Backend is implemented using Google Apps Script (GAS) as an API.
