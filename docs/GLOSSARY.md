# Glossary — ClaimLens

## Core Concepts

**Route**
API endpoint that processes specific types of content analysis requests. Examples: `/analyze` for full menu validation, `/validate` for single-item checks.

**Profile** 
Configuration preset that defines which transforms to apply and their parameters. Two main profiles: `menushield_in` (B2B pre-publish gate) and `claimlens_go` (B2C overlay).

**Transform**
Pure function that analyzes or modifies text content. Examples: `rewrite.disclaimer` (adds legal disclaimers), `redact.pii` (removes personal information), `highlight.allergens` (marks allergen content).

**Fixture**
Test data file containing sample menu items or website HTML used for validation and regression testing. Located in `/fixtures/menu/` and `/fixtures/sites/`.

**Audit Pack**
Collection of rules and reference data for a specific domain. Examples: `allergens.in.yaml` (Indian allergen database), `banned.claims.in.yaml` (prohibited marketing terms), `disclaimers.in.md` (legal disclaimer templates).

**Latency Budget**
Maximum allowed processing time for a route or transform, enforced in CI/CD pipeline. Specified in `policies.yaml` as `latency_budget_ms`.

**Augment-Lite**
Policy editing interface with built-in critique and validation. Allows safe modification of rule packs with immediate feedback on potential impacts.

## Product Terms

**ClaimLens MenuShield**
B2B service that validates food content before publication. Integrates with cloud kitchens and food marketplaces via API.

**ClaimLens Go**
B2C browser extension that overlays warnings and information on food delivery websites in real-time.

**ClaimLens Packs**
Curated rule sets for specific locales and regulatory environments. Includes allergen databases, banned claim lists, and disclaimer templates.

## Technical Terms

**MCP (Model Context Protocol)**
Extensibility framework for integrating external services like OCR, unit conversion, and recall lookups. Configured in `.kiro/mcp/registry.json`.

**Steering Rules**
Development guidelines and constraints defined in `.kiro/steering/style.md`. Includes tone, accessibility, logging, and commit standards.

**Hook Scripts**
Automated governance scripts that run during development lifecycle. Examples: `precommit_contracts.sh` (runs tests), `pr_verify.sh` (checks performance), `release_gate.sh` (validates completeness).

**Policy DSL**
Domain-specific language for defining content analysis rules and transform pipelines. Specified in `.kiro/specs/policies.yaml`.

## Regulatory Terms

**WCAG AA**
Web Content Accessibility Guidelines Level AA compliance. Requires 4.5:1 color contrast, keyboard navigation, and screen reader compatibility.

**PII (Personally Identifiable Information)**
Data that can identify individuals. ClaimLens redacts email addresses, phone numbers, and postal codes from content and logs.

**Locale-Correct Disclaimers**
Legal text required by jurisdiction for specific health or nutrition claims. Automatically inserted based on content analysis and user location.