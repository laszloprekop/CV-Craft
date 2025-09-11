# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CV-Craft is a webapp for creating static CV websites and PDFs from structured Markdown files. The project uses the **official GitHub Spec kit** for Spec-Driven Development (SDD) with a three-phase lifecycle:

1. **Specification**: `/specify` - Create feature branch and specification
2. **Planning**: `/plan` - Generate implementation plan and design documents  
3. **Task Execution**: `/tasks` - Break down into executable tasks

## Core Architecture

### Directory Structure
- `CV-Craft/` - Official GitHub Spec kit framework
  - `memory/constitution.md` - Project constitution (needs customization for your project)
  - `scripts/` - Spec kit shell scripts for development workflow
  - `templates/` - Spec kit templates for specifications, plans, and tasks
  - `.claude/commands/` - Claude Code commands (auto-detected by Claude Code)
- `specs/` - Feature specifications organized by branch (created automatically)
- `_drafts/` - Draft CV files and project documentation  
- `source_files/` - Directory for source assets

### Key Scripts & Commands

**Development Workflow Scripts:**
```bash
# From repository root (CV-Craft/ subdirectory contains the framework)
./CV-Craft/scripts/create-new-feature.sh "feature description"
./CV-Craft/scripts/setup-plan.sh --json
./CV-Craft/scripts/check-task-prerequisites.sh --json
```

**Claude Code Commands (Auto-detected):**
- `/specify "feature description"` - Start new feature (Phase 1)
- `/plan "implementation details"` - Create implementation plan (Phase 2) 
- `/tasks` - Generate executable task breakdown (Phase 3)

These commands are automatically detected by Claude Code from the `.claude/commands/` directory.

### Spec-Driven Development Flow

1. **Feature Branch Creation**: Features use numbered branches (e.g., `001-user-auth`, `002-cv-templates`)
2. **Specification Generation**: Creates `specs/{branch}/spec.md` using business requirements
3. **Planning Phase**: Generates technical implementation plan and design documents:
   - `plan.md` - Core implementation plan
   - `research.md` - Technical research (optional)
   - `data-model.md` - Entity definitions (optional)
   - `contracts/` - API contracts (optional)
   - `quickstart.md` - Test scenarios (optional)
4. **Task Generation**: Creates numbered, executable tasks (`T001`, `T002`, etc.) with dependency tracking

### Templates System

The project uses template-driven development:
- `spec-template.md` - Business requirement specification
- `plan-template.md` - Technical implementation planning
- `tasks-template.md` - Task breakdown structure
- `agent-file-template.md` - Agent context template

Templates contain execution flows and automated validation gates.

## Development Guidelines

### Branch Management
- Always work on numbered feature branches (`001-feature-name`)
- Scripts automatically create properly named branches
- Feature directories match branch names in `specs/`

### File Path Requirements
- All scripts expect absolute paths from repository root
- Use `git rev-parse --show-toplevel` to get repository root
- Scripts handle path resolution automatically when run from repo root

### Constitution Compliance
- Read `CV-Craft/memory/constitution.md` before planning
- Constitution defines project-specific principles and constraints
- Currently contains template placeholders - needs customization for project

### Script Dependencies
- Scripts use `CV-Craft/scripts/common.sh` for shared functions
- JSON mode available for programmatic usage (`--json` flag)
- Error handling with specific exit codes and messages

## Working with This Repository

### Starting a New Feature
```bash
cd /path/to/CV-Craft  # Repository root
./CV-Craft/scripts/create-new-feature.sh "add user authentication"
# Creates branch, spec directory, and initializes spec.md
```

### Using Claude Commands
The custom commands are defined in `CV-Craft/.claude/commands/`:
- Commands automatically handle script execution and path resolution
- Follow the three-phase SDD lifecycle in sequence
- Templates guide execution with built-in validation

### Architecture Considerations
- Project appears to be in early setup phase (no actual implementation yet)
- Focus on static site generation for CVs with PDF export capability
- Template-driven approach for both development workflow and CV generation
- Serverless database planned for data storage