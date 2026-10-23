# MiniBank — Test Plan

## 1. Objective

To verify the functionality and reliability of the MiniBank banking application through systematic testing, primarily using Selenium WebDriver.

## 2. Scope

- User registration
- User login and authentication
- Input validation
- User profile access
- Account creation and account listing
- Account details and balance display
- Fund transfers
- Transaction history
- Authentication and authorization checks

## 3. Testing Types

- Functional testing
- Negative testing
- Boundary testing where applicable
- Regression testing

## 4. Technology Stack

- Backend: Node.js and TypeScript
- API framework: Express
- Database: PostgreSQL
- API validation: Zod
- Authentication: JWT
- Browser testing: Selenium WebDriver
- Test framework and shared fixtures: To be confirmed with the team

## 5. Test Environment

Testing will use fictional customers and simulated banking data in the agreed local development environment.

The frontend URL, browser configuration, test framework, test database, and database reset procedure will be documented after team confirmation.

## 6. Entry Criteria

- Required application pages are available.
- Frontend selectors and expected messages are confirmed.
- Shared Selenium fixtures are available.
- Test data and reset instructions are documented.

## 7. Exit Criteria

- Planned test cases have been executed or marked as blocked.
- Actual results are recorded.
- Failures are documented with reproduction steps.
- Relevant fixes are retested.
- Regression testing is completed.

## 8. Responsibilities

Shaurya is responsible for the test plan, test-case catalogue, authentication tests, and account tests. Team members will coordinate on the frontend, shared Selenium framework, transaction tests, and final reporting.

## 9. Reporting

Every test case will have a unique ID, priority, preconditions, test steps, test data, expected result, actual result, execution status, and defect ID where applicable.

Test results will be recorded only after actual execution.