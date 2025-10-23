# Medical Scribe AI

A comprehensive, AI-powered medical transcription and documentation application built with React, TypeScript, and modern web technologies. This application provides real-time speech-to-text transcription, automated SOAP note generation, and intelligent clinical documentation assistance for healthcare providers.

## 🚀 Features

### Core Functionality

- **Real-time Speech Transcription**: High-accuracy speech-to-text using OpenAI Whisper API
- **Speaker Diarization**: Automatic identification of provider vs. patient speech
- **AI-Powered Documentation**: Automated SOAP note generation with clinical entity extraction
- **Session Management**: Complete session lifecycle with pause, resume, and auto-save capabilities
- **Export & Sharing**: Multiple export formats (PDF, JSON, TXT) with clipboard support

### Advanced Features

- **Search & Filter**: Comprehensive search across transcripts and documentation
- **Performance Optimized**: Code splitting, lazy loading, and optimized real-time updates
- **Accessibility Compliant**: WCAG 2.1 AA compliant with screen reader support
- **Responsive Design**: Mobile-first design that works on all devices
- **Security & Privacy**: Secure data handling with session timeout and data encryption

### Technical Highlights

- **Modern React**: Built with React 18, TypeScript, and Vite
- **State Management**: Optimized state management with React Context and custom hooks
- **Storage**: IndexedDB with caching and batch operations for optimal performance
- **UI/UX**: Tailwind CSS with custom animations and micro-interactions
- **Testing**: Comprehensive unit and integration tests

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0 or higher)
- **npm** or **yarn** package manager
- **OpenAI API Key** (for transcription and documentation features)

## 🛠️ Installation

1. **Clone the repository**
    git clone https://github.com/your-username/medical-scribe-ai.git
    cd medical-scribe-ai
2. **Install dependencies**
    npm install
    # or
    yarn install
3. **Set up environment variables**
    cp .env.example .env

    Edit the `.env` file and add your API keys:
    VITE_OPENAI_API_KEY=your_openai_api_key_here
    VITE_APP_NAME=Medical Scribe AI
    VITE_APP_VERSION=1.0.0

4. **Start the development server**
    npm run dev
    # or
    yarn dev

5. **Open your browser**
    - Navigate to `http://localhost:5173` to see the application.

## 🔧 Configuration

### API Keys Setup

#### OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Add the key to your `.env` file as `VITE_OPENAI_API_KEY`

### Browser Permissions

The application requires the following browser permissions:

- **Microphone Access**: For real-time speech transcription
- **Storage**: For saving sessions and user preferences

## 📖 Usage Guide

### Starting a New Session

1. **Create Session:** Click "Start New Session" on the dashboard
2. **Grant Permissions:** Allow microphone access when prompted
3. **Begin Recording:** Click the record button to start transcription
4. **Monitor Progress:** Watch real-time transcription and documentation generation

### Managing Sessions

- **Pause/Resume**: Use recording controls to pause and resume sessions
- **Auto-Save**: Sessions are automatically saved every 5 seconds
- **Review**: Access completed sessions from the Session History page
- **Edit**: Modify SOAP notes and documentation in the Session Review page

### Exporting Data

1. **Select Sessions**: Choose one or more sessions to export
2. **Choose Format**: Select from PDF, JSON, or TXT formats
3. **Configure Options**: Customize what data to include
4. **Download**: Export files or copy to clipboard

### Search & Filter

- **Text Search**: Search across transcripts, SOAP notes, and clinical entities
- **Filter Options**: Filter by status, date range, visit type, or patient ID
- **Sort Results**: Sort by date, duration, or status

## 🏗️ Project Structure

src/
├── components/         # Reusable UI components
│   ├── animations/     # Animation components and utilities
│   ├── common/         # Common UI components
│   ├── documentation/  # Documentation-related components
│   ├── export/         # Export functionality components
│   ├── layout/         # Layout components (Header, Sidebar)
│   ├── recording/      # Recording controls and visualization
│   ├── search/         # Search and filter components
│   ├── sessions/       # Session management components
│   └── transcript/     # Transcript display components
├── context/            # React Context providers
├── hooks/              # Custom React hooks
├── models/             # TypeScript type definitions
├── pages/              # Main application pages
├── services/           # Business logic and API services
├── utils/              # Utility functions and helpers
└── App.tsx             # Main application component

## 🧪 Testing

### Running Tests

# Run all tests
npm test
# Run tests in watch mode
npm run test:watch
# Run tests with coverage
npm run test:coverage

### Test Structure

- **Unit Tests**: Individual component and utility function tests
- **Integration Tests**: Service integration and workflow tests
- **Accessibility Tests**: Automated accessibility compliance checks

## 🚀 Building for Production

### Build the Application

npm run build
# or
yarn build

### Preview Production Build

npm run preview
# or
yarn preview

### Deployment Options

The application can be deployed to any static hosting service:

- **Vercel**: vercel --prod
- **Netlify**: Drag and drop the `dist` folder
- **GitHub Pages**: Use GitHub Actions for automated deployment
- **AWS S3**: Upload the `dist` folder to an S3 bucket

## 🔒 Security & Privacy

### Data Handling

- All patient data is stored locally in the browser's IndexedDB
- No sensitive data is transmitted to external servers except for AI processing
- Session timeout automatically protects against unauthorized access
- Secure data deletion permanently removes all associated information

### API Security

- API keys are never exposed in the client-side code
- All API communications use HTTPS
- Rate limiting and error handling prevent abuse

### Compliance Considerations

- The application is designed with HIPAA compliance principles in mind
- Implement additional security measures as required by your organization
- Regular security audits and updates are recommended

## 🎨 Customization

### Theming

The application uses Tailwind CSS for styling. Customize the theme by editing:

- tailwind.config.js - Main theme configuration
- src/App.css - Global styles and CSS variables

### Configuration

Modify application behavior through:

- Environment variables in .env
- Configuration files in src/config/
- Service settings in individual service files

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**: git checkout -b feature/amazing-feature
3. **Make your changes**: Follow the coding standards and add tests
4. **Commit your changes**: git commit -m 'Add amazing feature'
5. **Push to the branch**: git push origin feature/amazing-feature
6. **Open a Pull Request**: Describe your changes and their benefits

### Development Guidelines

- **Code Style**: Follow the existing TypeScript and React patterns
- **Testing**: Add tests for new features and bug fixes
- **Documentation**: Update documentation for any API changes
- **Accessibility**: Ensure all new components are accessible

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Troubleshooting

### Common Issues

#### Microphone Not Working

- Ensure browser permissions are granted
- Check if another application is using the microphone
- Try refreshing the page and granting permissions again

#### API Errors

- Verify your OpenAI API key is correct and has sufficient credits
- Check your internet connection
- Review the browser console for detailed error messages

#### Performance Issues

- Clear browser cache and IndexedDB data
- Close other resource-intensive browser tabs
- Ensure you're using a supported browser (Chrome, Firefox, Safari, Edge)

### Getting Help

- **Documentation**: Check this README and inline code documentation
- **Issues**: Report bugs and request features on GitHub Issues
- **Discussions**: Join community discussions on GitHub Discussions

## 🔄 Changelog

### Version 1.0.0 (Current)
- Initial release with core transcription and documentation features
- Real-time speech-to-text with speaker diarization
- AI-powered SOAP note generation
- Comprehensive session management
- Export functionality with multiple formats
- Search and filter capabilities
- Performance optimizations and accessibility features

## 🙏 Acknowledgments

- **OpenAI** for providing the Whisper API for speech transcription
- **React Team** for the excellent React framework
- **Tailwind CSS** for the utility-first CSS framework
- **Vite** for the fast build tool and development server
- **Healthcare Community** for feedback and requirements guidance

## 📊 Performance Metrics

The application is optimized for performance with the following targets:

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3.5s
- **Cumulative Layout Shift**: < 0.1

## 🌐 Browser Support

- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

## 📱 Mobile Support

The application is fully responsive and supports:

- **iOS Safari**: 14+
- **Chrome Mobile**: 90+
- **Samsung Internet**: 14+

---

**Built with ❤️ for healthcare providers worldwide**
