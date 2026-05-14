# 🏥 Doctor EMR System - AI-Powered Clinical Management Platform

A comprehensive, production-grade Electronic Medical Records (EMR) system built with Next.js 15, featuring advanced AI-powered symptom analysis, risk assessment, and complete patient management capabilities.

## ✨ Key Features

### 🤖 AI-Powered Clinical Intelligence
- **Symptom Analysis**: Advanced AI system that analyzes patient symptoms and predicts possible diseases with confidence percentages
- **Medicine Recommendations**: Intelligent drug suggestions with dosage, side effects, warnings, and contraindications
- **Risk Assessment Engine**: Sophisticated algorithm for patient risk scoring and mortality risk estimation
- **Treatment Duration Estimates**: AI-powered recovery timeline predictions

### 👨‍⚕️ Comprehensive Patient Management
- Complete patient CRUD operations with detailed medical records
- Patient history with timeline view
- Vital signs tracking and analysis
- Medical file attachments and imaging
- Emergency contact management

### 📊 Advanced Analytics & Dashboard
- Real-time clinical metrics and KPIs
- Interactive charts using Recharts
- Disease distribution analytics
- Risk level visualization
- Weekly visit trends and patterns

### 🔐 Secure Authentication System
- JWT-based authentication with bcrypt password hashing
- Role-based access control
- Session management and persistence
- Secure password recovery

### 🎨 Modern UI/UX Design
- Glassmorphism design with smooth animations
- Dark/Light mode support
- Mobile-responsive layout
- Loading skeletons and optimistic UI updates
- Toast notifications and alerts

### 📅 Appointment Management
- Calendar integration with react-big-calendar
- Drag-and-drop appointment scheduling
- Appointment reminders and notifications
- Doctor availability management

### 🔍 Advanced Search & Filtering
- Patient search with Fuse.js
- Advanced filtering by date, disease, risk level
- Export functionality (CSV/PDF)
- Pagination and sorting

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **UI**: Tailwind CSS + shadcn/ui components
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod validation
- **Calendar**: react-big-calendar
- **Tables**: TanStack Table
- **Theme**: next-themes

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + bcrypt
- **API**: RESTful API routes
- **Validation**: Zod schemas
- **File Upload**: Multer
- **Email**: Nodemailer
- **SMS**: Twilio

### AI & External Services
- **AI**: OpenAI API compatible
- **Medical APIs**: RxNorm, openFDA integration
- **Search**: Fuse.js / Meilisearch

### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Database**: PostgreSQL 15
- **Caching**: Redis
- **Proxy**: Nginx
- **Environment**: Production-ready configuration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis (optional, for caching)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd doctor-emr-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up the database**
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma db push

# Seed the database (optional)
npm run db:seed
```

5. **Start the development server**
```bash
npm run dev
```

6. **Open your browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 🐳 Docker Deployment

### Using Docker Compose (Recommended)

1. **Clone and configure**
```bash
git clone <repository-url>
cd doctor-emr-system
cp .env.example .env
# Configure your environment variables
```

2. **Start all services**
```bash
docker-compose up -d
```

3. **Access the application**
- Frontend: http://localhost:3000
- Database: localhost:5432
- Redis: localhost:6379

### Manual Docker Build

```bash
# Build the image
docker build -t doctor-emr .

# Run the container
docker run -p 3000:3000 --env-file .env doctor-emr
```

## 📁 Project Structure

```
doctor-emr-system/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Main dashboard
│   │   ├── patients/          # Patient management
│   │   └── globals.css        # Global styles
│   ├── components/            # Reusable components
│   │   └── ui/               # shadcn/ui components
│   ├── lib/                   # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── store/                 # State management
│   └── types/                 # TypeScript definitions
├── prisma/
│   ├── schema.prisma         # Database schema
│   └── seed.ts              # Database seeding
├── public/                    # Static assets
├── uploads/                   # File uploads directory
├── Dockerfile                # Docker configuration
├── docker-compose.yml        # Multi-container setup
├── package.json             # Dependencies
└── README.md                # This file
```

## 🔧 Configuration

### Environment Variables

Key environment variables to configure:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/doctor_emr"

# Authentication
JWT_SECRET="your-super-secret-jwt-key"
NEXTAUTH_SECRET="your-nextauth-secret-key"

# AI Services
OPENAI_API_KEY="your-openai-api-key"

# Medical APIs
RXNORM_API_KEY="your-rxnorm-api-key"
OPENFDA_API_KEY="your-openfda-api-key"

# Communication
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

### Database Setup

1. **Create PostgreSQL database**
```sql
CREATE DATABASE doctor_emr;
```

2. **Run migrations**
```bash
npx prisma db push
```

3. **Seed data (optional)**
```bash
npm run db:seed
```

## 📊 Features Overview

### AI Symptom Analysis
- Input patient symptoms and get AI-powered disease predictions
- Confidence scores for each possible condition
- Suggested medications with detailed information
- Risk assessment and severity evaluation

### Patient Risk Assessment
- Comprehensive risk scoring algorithm
- Mortality risk estimation
- Hospitalization and ICU recommendations
- Recovery timeline predictions

### Dashboard Analytics
- Total patients and active cases
- Critical patient alerts
- Recovery rate tracking
- Weekly visit trends
- Disease distribution charts
- Most prescribed medications

### Patient Management
- Complete patient profiles with medical history
- Visit tracking and documentation
- Prescription management
- Vital signs monitoring
- File attachments and medical imaging

## 🔒 Security Features

- JWT-based authentication with secure token handling
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting and DDoS protection
- CORS configuration
- SQL injection prevention with Prisma ORM
- File upload security
- Environment variable protection

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run E2E tests
npm run test:e2e

# Test coverage
npm run test:coverage
```

## 📱 Mobile Responsiveness

The application is fully responsive and works seamlessly on:
- Desktop computers
- Tablets
- Mobile phones
- Various screen sizes and orientations

## 🌍 Internationalization

The system supports multiple languages and can be easily extended with additional locales.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Email: support@doctor-emr.com
- Documentation: [docs.doctor-emr.com](https://docs.doctor-emr.com)

## 🗺️ Roadmap

### Upcoming Features
- [ ] Telemedicine integration
- [ ] Lab results integration
- [ ] Billing and insurance management
- [ ] Mobile app (React Native)
- [ ] Advanced reporting system
- [ ] HL7/FHIR interoperability
- [ ] Multi-clinic support
- [ ] Advanced analytics with ML

### Version History
- **v1.0.0** - Initial release with core EMR functionality
- **v1.1.0** - AI symptom analysis and risk assessment
- **v1.2.0** - Advanced analytics and reporting
- **v2.0.0** - Telemedicine and mobile app support

## 🙏 Acknowledgments

- Medical professionals who provided clinical insights
- Open source community for amazing libraries and tools
- Design inspiration from modern healthcare applications
- AI and medical research communities

---

**⚠️ Medical Disclaimer**: This system is designed to assist healthcare professionals and should not replace clinical judgment. Always consult with qualified medical professionals for patient care decisions.

**🔒 Privacy & Security**: All patient data is encrypted and handled in compliance with healthcare privacy regulations (HIPAA, GDPR, etc.).
