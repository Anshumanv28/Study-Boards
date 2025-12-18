# StudyBoards Application

A modern, responsive web application for Boards preparation with dynamic content management through Supabase Storage.

## Features

- 🔐 **Authentication**: Secure login/signup with Google and Facebook OAuth
- 📚 **Dynamic Content**: Automatically displays topics and files from Supabase Storage
- 📄 **File Support**: View PDFs and download DOCX files
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- ⚡ **Fast Performance**: Frontend-only architecture with direct S3 integration
- 🎨 **Modern UI**: Clean interface built with React and TailwindCSS

## Architecture

This application uses a **frontend-only architecture**:

- ✅ **React Frontend** - Built with Create React App and TypeScript
- ✅ **Supabase Auth** - Direct authentication integration
- ✅ **Supabase Storage** - S3-compatible file storage
- ❌ **No Backend** - Simplified deployment and maintenance

## Quick Start

### Prerequisites

- Node.js 18+
- Supabase account
- Git

### Local Development

1. **Clone the repository:**

   ```bash
   git clone https://github.com/Anshumanv28/StudyBoards.git
   cd StudyBoards
   ```

2. **Install dependencies:**

   ```bash
   cd frontend
   npm install
   ```

3. **Set up environment variables:**

   ```bash
   cp ../env.example ../.env
   # Edit .env with your Supabase credentials
   ```

4. **Start the development server:**

   ```bash
   npm start
   ```

5. **Open your browser:**
   Navigate to http://localhost:3000

### Docker Deployment

1. **Build and run:**

   ```bash
   docker-compose up --build
   ```

2. **Access the application:**
   Open http://localhost

## Supabase Setup

1. Create a Supabase project
2. Enable Authentication with OAuth providers
3. Create a Storage bucket named `Study-Boards`
4. Set up S3-compatible API keys
5. Upload your Boards Study organized by topic folders

## File Organization

Organize your files in the storage bucket like this:

```
Study-Boards/
├── algebra/
│   ├── equations.pdf
│   ├── inequalities.docx
│   └── functions.pdf
├── geometry/
│   ├── circles.pdf
│   ├── triangles.docx
│   └── angles.pdf
└── statistics/
    ├── probability.pdf
    └── data-analysis.docx
```

## Deployment

### Vercel (Recommended)

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.

### Other Platforms

- **Netlify**: Works with static site generation
- **AWS S3 + CloudFront**: For AWS-based deployment
- **Docker**: Use the provided Docker configuration

## Environment Variables

Required environment variables (see `env.example`):

- `REACT_APP_SUPABASE_URL`
- `REACT_APP_SUPABASE_ANON_KEY`
- `REACT_APP_S3_ACCESS_KEY_ID`
- `REACT_APP_S3_SECRET_ACCESS_KEY`
- `REACT_APP_S3_ENDPOINT`
- `REACT_APP_S3_REGION`
- `REACT_APP_S3_BUCKET_NAME`

## Tech Stack

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage (S3-compatible)
- **Deployment**: Vercel, Docker
- **Build Tool**: Create React App

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

ISC License - see LICENSE file for details

## Support

For issues and questions:

- Create an issue on GitHub
- Check the deployment guides in the repository
- Review Supabase documentation

---

Built with ❤️ for Boards students everywhere!
