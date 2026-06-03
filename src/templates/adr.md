---
adr_id: "{{ADR_ID}}"
title: "Short, Imperative Title of Decision"
date_created: "{{DATE}}"
status: "{{STATUS}}"
authors:
  - "{{AUTHOR}}"
impact_areas:
  - "Architecture"
related_rfcs:
  - "RFC-1234"
tickets:
  - "PROJ-1234"
superseded_by: "{{SUPERSEDED_BY}}"
---

# {{ADR_ID}}: Short, Imperative Title of Decision

<!-- LANGUAGE AND TONE DIRECTIVE: This document MUST use formal, technical English. Write in present tense. Use the RFC 2119 key phrases (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) where this document prescribes behaviour. Avoid marketing language, subjective opinions, and vague statements. Every claim MUST be supported by evidence or a clear rationale. -->

## 1. Context and Problem Statement

### 1.1 Technical Background

Write two to three paragraphs describing the current system architecture, the business domain, and the specific technical circumstances that motivate this decision. Include relevant history — why was the current approach chosen, and what has changed to require a new decision.

### 1.2 Current State Metrics

Provide quantitative measurements of the current state. Include at least two metrics with concrete values. Examples: "Current P95 API latency is 1 200 ms", "Deployment cycle time averages 4.5 hours", "Cache hit rate is 67 %". If metrics are unavailable, state the methodology for obtaining them.

## 2. Decision Drivers

List exactly three to five architectural drivers that influence this decision. Each driver MUST name a quality attribute (e.g. security, latency, maintainability, cost, compliance) followed by a one-sentence description of the constraint or goal.

* **Driver A (e.g. Security):** Description of the driver, including the tolerable threshold or target.
* **Driver B (e.g. Latency):** Description of the driver, including the tolerable threshold or target.

## 3. Considered Options

For each option, provide a technical overview, a list of advantages, and a list of trade-offs. Each pro and con MUST be a complete sentence, not a single word.

### Option 1: [Short Descriptive Name]

* **Technical Overview:** One- to two-sentence description of how this option works at an architectural level.
* **Pros:**
  * Advantage one — explain why this addresses a decision driver from Section 2.
  * Advantage two — explain why this addresses a decision driver from Section 2.
* **Cons:**
  * Trade-off one — explain the cost or risk introduced.
  * Trade-off two — explain the cost or risk introduced.

### Option 2: [Short Descriptive Name]

* **Technical Overview:** One- to two-sentence description of how this option works at an architectural level.
* **Pros:**
  * Advantage one — explain why this addresses a decision driver from Section 2.
  * Advantage two — explain why this addresses a decision driver from Section 2.
* **Cons:**
  * Trade-off one — explain the cost or risk introduced.
  * Trade-off two — explain the cost or risk introduced.

## 4. Decision Outcome

Chosen Option: **Option X**, because [insert definitive high-level architectural rationale explicitly linked back to the drivers in Section 2].

### 4.1 RFC 2119 Compliance Directive

All software engineering execution items resulting from this architecture decision MUST strictly comply with the [IETF RFC 2119](https://tools.ietf.org/html/rfc2119) standard phrasing. The tokens **MUST**, **MUST NOT**, **REQUIRED**, **SHOULD**, and **MAY** dictate absolute protocol criteria in the requirements below.

### 4.2 Core Engineering Requirements

Write between three and six numbered requirements. Each requirement MUST use RFC 2119 key phrases and MUST be testable or verifiable by inspection.

1. System Component A **MUST** [insert strict requirement with measurable criterion].
2. Database Operations **MUST NOT** [insert strict limitation with measurable criterion].
3. Client Responses **SHOULD** [insert optimal recommendation with measurable criterion].

## 5. Validation, Tracking, and Lifecycle

### 5.1 Verification Plan

- **Method:** Describe the specific verification technique (e.g. load test, security audit, manual inspection, automated integration test).
- **Success Metric:** Define the pass/fail criterion in measurable terms.

### 5.2 Implementation Tracking

- **Epic Link:** Reference the Jira or GitHub epic that tracks implementation.

### 5.3 Review Cycle

- **Revisit Trigger:** Define the event or calendar date that should trigger a review of this decision (e.g. "When monthly active users exceed 500 000" or "Q3 2026 architecture review").

---

*This ADR is a living architectural specification. Changes or updates to this architectural state require a new ADR submission to supersede this record.*
