---
rfc_id: "{{RFC_ID}}"
title: "Clear, Actionable Title of the Proposal"
date_created: "{{DATE}}"
status: "{{STATUS}}"
authors:
  - "{{AUTHOR}}"
target_version: "{{TARGET_VERSION}}"
epics:
  - "EPIC-1234"
---

# {{RFC_ID}}: Clear, Actionable Title of the Proposal

<!-- LANGUAGE AND TONE DIRECTIVE: This document MUST use formal, technical English. Write in present tense. Use the RFC 2119 key phrases (MUST, MUST NOT, SHOULD, SHOULD NOT, MAY) where this document prescribes required or recommended behaviour. Support every factual claim with evidence or a rationale. Avoid subjective or promotional language. -->

> **Status:** {{STATUS}} — **Target Version:** {{TARGET_VERSION}}

## 1. Executive Summary

Summarise the proposal in exactly three to five sentences. Cover the problem, the proposed change, and the expected outcome. This section MUST stand alone — a reader should understand the essence without reading further.

## 2. Motivation and Business Value

### 2.1 Problem Statement

Describe the current limitation, pain point, or missed opportunity in one to two paragraphs. Include at least one quantitative data point (e.g. page-load latency, error rates, developer-hours spent on workarounds). If no data is available, describe the measurement plan.

### 2.2 Expected Business Outcomes

Write exactly three numbered outcomes. Each outcome MUST be framed as a measurable statement using future tense or RFC 2119 key phrases.

1. **Outcome one** — describe the measurable benefit, e.g. "Reduce P95 API latency by 40 %."
2. **Outcome two** — describe the second measurable benefit.
3. **Outcome three** — describe the third measurable benefit.

## 3. Proposed Technical Design

### 3.1 Architecture Overview

Provide a high-level description of the proposed system or component changes in one paragraph. Include a rough call-flow or data-flow narrative. Diagrams MAY be linked externally or embedded as Mermaid diagrams in a follow-up revision.

### 3.2 Detailed Implementation Specifications

Address each of the following categories. Use a paragraph or a bullet list per category as appropriate.

1. **Module / service boundary** — which components are created, modified, or removed.
2. **Data model changes** — new fields, tables, or schema migrations required.
3. **API contract changes** — new or modified endpoints, request/response shapes, error codes.
4. **Configuration and feature flags** — how the change is gated and rolled out.

### 3.3 Security, Privacy, and Compliance Implications

Answer each of the following questions. If the answer is "none", state that explicitly.

- **Authentication / authorisation** — are new permissions or roles needed?
- **Data handling** — is any personally identifiable information (PII) introduced?
- **Compliance** — does this change affect SOC 2, GDPR, PCI-DSS, or other certification boundaries?

## 4. Drawbacks and Technical Debt

Address each of the following concerns. Acknowledge trade-offs honestly; a proposal with zero drawbacks is not credible.

1. **Operational overhead** — describe any new monitoring, alerting, or maintenance burden.
2. **Complexity** — describe how this change increases overall system complexity.
3. **Reversibility** — can this change be rolled back? If so, what is the procedure and blast radius?
4. **Cost** — estimate infrastructure, licensing, or team-hour costs.

## 5. Alternatives Considered

Document exactly two alternatives that were seriously evaluated but rejected. Each alternative MUST include a positive aspect (approach) and a concrete rejection reason linked to a decision driver from Section 2.

### Alternative A: [Short Name]

- **Approach:** Briefly describe the alternative in one to two sentences.
- **Why it was rejected:** Concrete reason explicitly tied to a driver from Section 2.

### Alternative B: [Short Name]

- **Approach:** Briefly describe the alternative in one to two sentences.
- **Why it was rejected:** Concrete reason explicitly tied to a driver from Section 2.

## 6. Testing, Verification, and Rollout Strategy

Address each of the following phases. Each phase MUST describe a specific activity and its acceptance criteria.

1. **Unit and integration testing** — what existing test suites are affected, and what new coverage is required.
2. **Load and performance testing** — acceptance criteria for latency, throughput, and resource usage.
3. **Deployment plan** — are feature flags, canary deploys, or a phased rollout used?
4. **Rollback procedure** — steps to revert the change if the deployment causes degradation.

---

**This RFC is a living proposal document. Changes or updates to the proposed design require a new RFC submission to supersede this record.**
