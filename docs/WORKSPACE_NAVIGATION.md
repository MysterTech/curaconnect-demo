# How to Access the New Workspace UI

## Method 1: Direct URL Navigation

1. **Start your dev server** (if not running):
   ```bash
   npm run dev
   ```

2. **Create or find a session ID**:
   - Go to `http://localhost:5173/` (your dashboard)
   - Create a new session or note an existing session ID
   - Session IDs look like: `session_1234567890`

3. **Navigate to the workspace**:
   - In your browser address bar, type:
   ```
   http://localhost:5173/workspace/YOUR_SESSION_ID
   ```
   - Replace `YOUR_SESSION_ID` with an actual session ID
   - Example: `http://localhost:5173/workspace/session_1234567890`

## Method 2: Add a Navigation Button

You can add a button to navigate from any page. Here's a quick example:

```tsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();

// In your component:
<button onClick={() => navigate(`/workspace/${sessionId}`)}>
  Open Workspace
</button>
```

## Method 3: Update Dashboard

Add this button to your Dashboard to quickly access the workspace:

```tsx
<button
  onClick={() => {
    // Create a new session and navigate to workspace
    const newSessionId = `session_${Date.now()}`;
    navigate(`/workspace/${newSessionId}`);
  }}
  className="px-4 py-2 bg-gray-900 text-white rounded-lg"
>
  Open New Workspace
</button>
```

## Features Available in Workspace

Once you're in the workspace (`/workspace/{sessionId}`), you can:

1. **Start/Stop Recording**: Click the microphone button at the bottom
2. **View Tabs**:
   - **Transcript**: See real-time transcription
   - **Context**: View session context
   - **Note**: See medical documentation
   - **Template**: Use Well Child Check template
3. **Manage Tasks**: Use the right sidebar for task management
4. **AI Assistant**: Type in the bottom input field

## Quick Test

To quickly test the new UI:

1. Open browser to: `http://localhost:5173/workspace/test-session`
2. Click the microphone button to start recording
3. Speak for 15+ seconds
4. Check the Transcript tab to see results

## Troubleshooting

If you see a "Session not found" error:
- The session ID doesn't exist yet
- Create a session first from the dashboard
- Or use any session ID - the UI will create it automatically when you start recording
