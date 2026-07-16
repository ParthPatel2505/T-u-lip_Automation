# Tulip Automation — Playwright Enterprise Framework

Automated testing framework for **Tulip UAT** built with [Playwright](https://playwright.dev/) using the **Page Object Model** pattern.

---

## 📁 Project Structure

```
playwright-enterprise-framework/
│
├── tests/                    # Test suites organized by type
│
├── pages/                    # Page Object Models
│   ├── BasePage.js           # Base class with reusable methods
│   └── LoginPage.js          # Login page object
│
├── components/               # Reusable UI component objects
│
├── fixtures/                 # Custom Playwright fixtures
│   └── baseFixture.js        # Extended test with loginPage fixture
│
├── utils/                    # Utility modules
│   ├── helper.js             # Common helper functions
│   ├── logger.js             # Winston-based logger
│   └── apiHelper.js          # API testing helper
│
├── data/                     # Test data
│   └── users.json            # Role-based user credentials
│
├── config/                   # Environment-specific configs
│   ├── qa.env
│   ├── stage.env
│   └── prod.env
│
├── reports/                  # Generated test reports
├── test-results/             # Playwright test artifacts
│
├── .env                      # Local environment variables (gitignored)
├── playwright.config.js      # Playwright configuration
├── package.json              # Project dependencies and scripts
└── README.md                 # This file
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- Access to Tulip UAT environment

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd Tulip_automation

# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Configure Credentials

Create your own `.env` file in the project root (this file is gitignored):

```env
BASE_URL=https://tulip-uat.tntra.io/tix/
DEFAULT_USERNAME=your.email@tntra.io
DEFAULT_PASSWORD=YourPassword
```

> **Note:** Each team member should create their own `.env` file with their personal credentials. Do not commit this file.

---

## 🧪 Running Tests

### All Tests
```bash
npm test
```

### By Suite
```bash
npm run test:smoke         # Smoke tests only
npm run test:regression    # Regression tests only
npm run test:api           # API tests only
npm run test:visual        # Visual tests only
```

### Specific Test File
```bash
npm run test:login                                    # Login smoke tests
npx playwright test tests/smoke/login.spec.js         # Same thing
```

### By Environment
```bash
npm run test:qa            # Uses config/qa.env
npm run test:stage         # Uses config/stage.env
npm run test:prod          # Uses config/prod.env
```

### With Browser UI (Headed Mode)
```bash
npm run test:headed
```

### Debug Mode
```bash
npm run test:debug
```

### View HTML Report
```bash
npm run report
```

---

## 🔑 Dynamic Login System

The framework supports three ways to provide login credentials:

### 1. Environment Variables (`.env`)
Each team member creates their own `.env`:
```env
DEFAULT_USERNAME=your.email@tntra.io
DEFAULT_PASSWORD=YourPassword
```

In tests:
```javascript
await loginPage.loginWithEnvCredentials();
```

### 2. Role-Based Users (`data/users.json`)
Define named user profiles:
```json
{
  "admin": { "username": "admin@tntra.io", "password": "Admin@123" },
  "member": { "username": "member@tntra.io", "password": "Member@123" }
}
```

In tests:
```javascript
await loginPage.loginAsUser('admin');
await loginPage.loginAsUser('member');
```

### 3. Direct Credentials
```javascript
await loginPage.login('user@tntra.io', 'Password@123');
```

---

## 🏗️ Adding New Page Objects

1. Create a new file in `pages/` (e.g., `DashboardPage.js`)
2. Extend `BasePage`:

```javascript
import { BasePage } from './BasePage.js';

export class DashboardPage extends BasePage {
  constructor(page) {
    super(page);
    // Define locators
    this.welcomeMessage = page.locator('.welcome-text');
  }

  // Add page-specific methods
  async getWelcomeText() {
    return await this.getElementText(this.welcomeMessage);
  }
}
```

3. Add a fixture in `fixtures/baseFixture.js` if needed
4. Use in tests via the fixture or direct instantiation

---

## 📊 Reports

- **HTML Report**: Generated automatically after each run in `reports/html-report/`
- **Execution Log**: Structured logs in `reports/test-execution.log`
- **Screenshots**: Captured on failure in `test-results/`
- **Videos**: Recorded on first retry in `test-results/`
- **Traces**: Captured on first retry — viewable with `npx playwright show-trace`

---

## 🛠️ Utilities

| Module | Description |
|--------|-------------|
| `utils/helper.js` | Random string/email generators, date formatting, JSON file I/O, retry logic, user data reader |
| `utils/logger.js` | Winston-based logger with console + file output |
| `utils/apiHelper.js` | API testing wrapper (GET, POST, PUT, PATCH, DELETE) with auto-auth |

---

## 👥 Team Guidelines

1. **Never commit `.env`** — each member maintains their own
2. **Use Page Objects** — don't write selectors directly in tests
3. **Extend `BasePage`** — leverage common methods instead of reinventing
4. **Use fixtures** — import `test` and `expect` from `fixtures/baseFixture.js`
5. **Organize tests** — place tests in the correct suite directory (smoke/regression/api/visual)
6. **Log test steps** — use `logStep()`, `logAction()`, `logValidation()` from logger

---

## 🤖 Playwright MCP (Model Context Protocol)

This project is configured to work with the **Playwright MCP Server**, allowing AI assistants (like Claude, Cursor, Windsurf, etc.) to control browser interactions directly using this project's setup.

### Starting the MCP Server

You can run the Playwright MCP server directly from the project root using:

```bash
npm run mcp
```

### Client Setup Examples

#### 1. Claude Desktop
Add the following to your `claude_desktop_config.json` (located in `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npm",
      "args": ["run", "mcp"]
    }
  }
}
```

#### 2. Cursor IDE
1. Go to **Settings** → **MCP**.
2. Click **+ Add New MCP Server**.
3. Fill in the details:
   - **Name**: `playwright`
   - **Type**: `command`
   - **Command**: `npm run mcp` (or absolute path if needed, e.g. `npx -y @playwright/mcp@latest`)

#### 3. Standalone (via SSE)
If you want to run the server on a port (e.g. `8931`):
```bash
npx @playwright/mcp@latest --port 8931
```

---

## 📝 License

ISC — Tulip QA Team
