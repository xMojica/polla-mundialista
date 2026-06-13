# Implementation Plan: Polla Mundialista

## Overview

This implementation plan covers the development of a React-based World Cup prediction pool application. The approach follows a bottom-up strategy: starting with core data models and services, then building reusable UI components, and finally integrating everything into a complete application with persistence and state management.

## Tasks

- [ ] 1. Set up project structure and dependencies
  - Initialize React project with Vite and TypeScript
  - Install dependencies (React, TypeScript, UUID library)
  - Configure TypeScript for strict type checking
  - Set up CSS Modules configuration
  - Create folder structure: `/src/components`, `/src/services`, `/src/contexts`, `/src/types`, `/src/utils`
  - _Requirements: 7.5, 8.1-8.5_

- [ ] 2. Implement core data models and type definitions
  - [ ] 2.1 Create TypeScript interfaces for all data models
    - Define `Match`, `Participant`, `Prediction`, `CorrectMark` interfaces
    - Define `AppState`, `RankedParticipant`, `ValidationResult` interfaces
    - Define `PredictionMap` and `CorrectMarkMap` type aliases
    - Create types file at `/src/types/index.ts`
    - _Requirements: 8.1-8.6_

  - [ ] 2.2 Implement UUID generation utility
    - Create utility function for generating unique IDs
    - Add helper for creating composite keys ("participantId:matchId")
    - _Requirements: 7.1-7.5_

- [ ] 3. Implement validation service
  - [ ] 3.1 Create ValidationService with prediction format validation
    - Implement `validatePrediction()` to check "[NUMBER]-[NUMBER]" format
    - Validate both numbers are non-negative integers
    - Return ValidationResult with isValid flag and error messages
    - _Requirements: 5.2, 5.3_

  - [ ] 3.2 Add participant name validation
    - Implement `validateParticipantName()` to check non-empty name
    - Trim whitespace and validate length constraints (max 100 chars)
    - _Requirements: 4.3_

  - [ ] 3.3 Add match information validation
    - Implement `validateMatch()` to verify team names, date, and time
    - Validate ISO 8601 date format and HH:MM time format
    - Ensure team1 ≠ team2
    - _Requirements: 8.3-8.5_

- [ ] 4. Implement match formatter service
  - [ ] 4.1 Create MatchFormatter with format and parse functions
    - Implement `format(match)` to produce "[TEAM1] vs [TEAM2] [DATE] [TIME]"
    - Implement `parse(input)` to extract match components from formatted string
    - _Requirements: 1.2, 8.1, 8.2_

  - [ ] 4.2 Write unit tests for MatchFormatter
    - Test formatting with various team names, dates, and times
    - Test parsing of valid and invalid formatted strings
    - Test edge cases (special characters in team names, date boundaries)
    - _Requirements: 8.6_

- [ ] 5. Implement ranking service
  - [ ] 5.1 Create RankingService with ranking calculation
    - Implement `calculateRanking()` to count correct predictions per participant
    - Sort by correct count descending, then alphabetically by name for ties
    - Assign rank numbers (1, 2, 3, etc.)
    - _Requirements: 2.1, 2.4, 2.5_

  - [ ] 5.2 Implement getTopN function
    - Extract top N participants from ranking
    - Handle edge cases (fewer than N participants)
    - _Requirements: 2.1_

  - [ ] 5.3 Write unit tests for RankingService
    - Test ranking with various correct prediction counts
    - Test tie-breaking (alphabetical order)
    - Test edge cases (empty participants, all zeros)
    - _Requirements: 2.5_

- [ ] 6. Implement persistence service
  - [ ] 6.1 Create PersistenceService with localStorage integration
    - Implement `saveState()` to serialize AppState to JSON and store in localStorage
    - Implement `loadState()` to deserialize from localStorage
    - Handle versioning for future data migrations
    - Include error handling for localStorage quota exceeded or unavailable
    - _Requirements: 7.1-7.5_

  - [ ] 6.2 Add convenience methods for individual operations
    - Implement `savePrediction()`, `saveCorrectMark()`, `saveParticipant()`
    - Each method loads state, updates specific entity, and saves full state
    - _Requirements: 7.1-7.3_

  - [ ] 6.3 Write unit tests for PersistenceService
    - Mock localStorage for testing
    - Test save and load round-trip
    - Test error handling (localStorage unavailable)
    - _Requirements: 7.4, 7.5_

- [ ] 7. Checkpoint - Ensure core services are working
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 8. Implement context and state management
  - [ ] 8.1 Create AppContext with state and actions
    - Define `AppContextValue` interface with state and action functions
    - Implement `AppProvider` component with useReducer for state management
    - Create reducer function to handle all state updates
    - _Requirements: 7.1-7.5_

  - [ ] 8.2 Implement context actions
    - Implement `addPrediction()`, `updatePrediction()`, `markCorrect()`
    - Implement `addParticipant()`, `addMatch()`, `toggleAdminMode()`
    - Each action triggers persistence after state update
    - _Requirements: 3.2, 3.3, 4.2, 5.4, 7.1, 7.2_

  - [ ] 8.3 Add computed values to context
    - Calculate ranking automatically when state changes
    - Memoize ranking calculation to avoid unnecessary recomputation
    - _Requirements: 2.3_

  - [ ] 8.4 Initialize state from localStorage on mount
    - Load persisted state in AppProvider initialization
    - Provide default state if localStorage is empty
    - _Requirements: 7.4_

- [ ] 9. Implement PredictionCell component
  - [ ] 9.1 Create PredictionCell with display and edit modes
    - Display prediction in "[SCORE1]-[SCORE2]" format
    - Switch to input field on click/tap for editing
    - Show checkmark icon when isCorrect is true
    - Apply visual styling for correct predictions (green highlight or checkmark)
    - _Requirements: 1.5, 1.6, 5.1, 9.1_

  - [ ] 9.2 Add validation and persistence to PredictionCell
    - Validate input format using ValidationService on blur or enter key
    - Display error message for invalid format
    - Call onChange callback only for valid predictions
    - Prevent editing if match is marked as finished
    - _Requirements: 5.2, 5.3, 5.4, 5.5_

  - [ ] 9.3 Style PredictionCell for mobile and accessibility
    - Use minimum font size of 16px for input fields
    - Ensure minimum tap target size of 44x44px
    - Apply sufficient contrast ratio (4.5:1) for text and icons
    - Use CSS Modules for scoped styling
    - _Requirements: 6.4, 6.5, 9.2, 9.5_

- [ ] 10. Implement ParticipantRow component
  - [ ] 10.1 Create ParticipantRow rendering predictions for all matches
    - Map over matches array to create PredictionCell for each match
    - Display participant name in the final column (sticky on horizontal scroll)
    - Apply row styling with clear visual separation
    - _Requirements: 1.3, 1.4, 10.4_

  - [ ] 10.2 Wire ParticipantRow to context for prediction updates
    - Connect to AppContext to access predictions and correctMarks maps
    - Handle onChange from PredictionCell to call updatePrediction action
    - Pass isCorrect prop based on correctMarks state
    - _Requirements: 5.4, 7.1_

- [ ] 11. Implement PredictionTable component
  - [ ] 11.1 Create table structure with match headers
    - Render table with sticky header row
    - Format match information using MatchFormatter in column headers
    - Apply column styling with clear visual separation
    - _Requirements: 1.1, 1.2, 10.2, 10.3_

  - [ ] 11.2 Render ParticipantRow for each participant
    - Map over participants array to create rows
    - Pass matches, predictions, correctMarks, and event handlers to each row
    - _Requirements: 1.3_

  - [ ] 11.3 Implement scrolling behavior for mobile
    - Enable horizontal scrolling with CSS overflow-x: auto
    - Enable vertical scrolling with CSS overflow-y: auto
    - Make participant name column sticky on horizontal scroll
    - Make header row sticky on vertical scroll
    - _Requirements: 1.7, 1.8, 10.1_

  - [ ] 11.4 Add admin controls to table (mark correct functionality)
    - When isAdmin is true, add clickable checkmark buttons to each cell
    - Call markCorrect action when clicked
    - Toggle behavior: click again to unmark
    - _Requirements: 3.1, 3.3, 3.4, 5.6_

- [ ] 12. Implement RankingDisplay component
  - [ ] 12.1 Create RankingDisplay showing top 3 participants
    - Access ranking from AppContext (computed value)
    - Display first 3 entries from ranking array
    - Show participant name and correct prediction count
    - Display in descending order
    - _Requirements: 2.1, 2.2, 2.4_

  - [ ] 12.2 Style RankingDisplay for mobile
    - Use Roboto font family with minimum 14px size
    - Ensure responsive layout for mobile devices
    - Apply clear visual hierarchy (1st, 2nd, 3rd)
    - _Requirements: 6.2, 6.3_

- [ ] 13. Implement AdminPanel component
  - [ ] 13.1 Create add participant form
    - Input field for participant name
    - Submit button to add participant
    - Validate name is non-empty before submission
    - Clear input after successful addition
    - _Requirements: 4.1, 4.3_

  - [ ] 13.2 Wire AdminPanel to context
    - Call addParticipant action on form submission
    - Display success/error feedback to user
    - _Requirements: 4.2, 4.5_

  - [ ] 13.3 Add admin mode toggle
    - Checkbox or toggle switch to enable/disable admin mode
    - Show/hide admin controls based on isAdminMode state
    - Persist admin mode preference to localStorage
    - _Requirements: 3.1, 3.4, 10.5_

  - [ ] 13.4 Style AdminPanel for mobile
    - Use minimum font size of 16px for input field
    - Ensure touch-friendly button size (44x44px minimum)
    - Apply consistent spacing and visual grouping
    - _Requirements: 6.4, 6.5_

- [ ] 14. Checkpoint - Ensure all components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 15. Implement main App component
  - [ ] 15.1 Create App component wrapping everything in AppProvider
    - Wrap application in AppProvider to provide context
    - Create basic layout structure (header, main content, footer)
    - _Requirements: 7.4_

  - [ ] 15.2 Add header with RankingDisplay
    - Position RankingDisplay prominently at top
    - Add application title and branding
    - _Requirements: 2.1_

  - [ ] 15.3 Add AdminPanel (conditionally shown)
    - Show AdminPanel based on isAdminMode from context
    - Position above or beside PredictionTable
    - _Requirements: 3.1, 4.1_

  - [ ] 15.4 Add PredictionTable as main content
    - Render PredictionTable with full width
    - Pass isAdmin prop from context
    - _Requirements: 1.1_

- [ ] 16. Implement global styles and responsive design
  - [ ] 16.1 Create global CSS with Roboto font and base styles
    - Import Roboto font from Google Fonts
    - Set base font size and family
    - Apply CSS reset for consistent cross-browser rendering
    - _Requirements: 6.2_

  - [ ] 16.2 Add mobile-responsive styles
    - Define media query for mobile devices (max-width: 768px)
    - Adjust font sizes, spacing, and layout for mobile
    - Ensure minimum font sizes (14px body, 16px inputs)
    - _Requirements: 6.1, 6.3, 6.4, 6.6_

  - [ ] 16.3 Add accessibility styles
    - Ensure color contrast ratios meet WCAG AA standards (4.5:1)
    - Add focus indicators for keyboard navigation
    - Add hover states for desktop users
    - _Requirements: 9.2, 9.5, 10.6_

  - [ ] 16.4 Test responsive behavior across devices
    - Test on iOS Safari (simulated)
    - Test on Android Chrome (simulated)
    - Verify horizontal and vertical scrolling works smoothly
    - _Requirements: 6.7, 1.7, 1.8_

- [ ] 17. Seed initial data and finalize integration
  - [ ] 17.1 Create seed data for initial matches
    - Add sample World Cup matches with realistic teams, dates, times
    - Initialize empty participants array
    - Create utility function to populate localStorage with seed data
    - _Requirements: 8.1-8.5_

  - [ ] 17.2 Test complete user flow: view → predict → mark → rank
    - Add a participant through AdminPanel
    - Enter predictions for multiple matches
    - Mark some predictions as correct
    - Verify ranking updates automatically
    - Verify all data persists after page reload
    - _Requirements: 1.1-1.8, 2.1-2.5, 3.1-3.5, 4.1-4.5, 5.1-5.6, 7.1-7.5_

  - [ ] 17.3 Write integration tests for critical flows
    - Test add participant → enter prediction → mark correct → ranking updates
    - Test data persistence across page reloads
    - Test mobile responsive behavior
    - _Requirements: 7.4, 2.3_

- [ ] 18. Final checkpoint - Ensure all requirements are met
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at logical milestones
- The implementation uses TypeScript for type safety throughout
- All data persists automatically to localStorage without manual saves
- Mobile-first responsive design ensures usability on all devices
- Admin controls are toggled via admin mode for streamlined UX
- Real-time ranking updates happen automatically through React Context
- No backend is required; all functionality works client-side
- Testing tasks validate core business logic and data integrity

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "2.2"] },
    { "id": 2, "tasks": ["3.1", "3.2", "3.3", "4.1", "5.1", "5.2", "6.1"] },
    { "id": 3, "tasks": ["4.2", "5.3", "6.2", "6.3", "8.1"] },
    { "id": 4, "tasks": ["8.2", "8.3", "8.4"] },
    { "id": 5, "tasks": ["9.1", "10.1", "12.1", "13.1"] },
    { "id": 6, "tasks": ["9.2", "10.2", "12.2", "13.2", "13.3"] },
    { "id": 7, "tasks": ["9.3", "11.1", "13.4"] },
    { "id": 8, "tasks": ["11.2", "11.3", "11.4"] },
    { "id": 9, "tasks": ["15.1"] },
    { "id": 10, "tasks": ["15.2", "15.3", "15.4"] },
    { "id": 11, "tasks": ["16.1", "16.2", "16.3"] },
    { "id": 12, "tasks": ["16.4", "17.1"] },
    { "id": 13, "tasks": ["17.2", "17.3"] }
  ]
}
```
