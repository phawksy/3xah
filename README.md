# AAA Auction House and Emporium

The Premier Destination for Discerning Trading Card Collectors

## Features

- Advanced Auction Types (English, Timed, Sealed Bid)
- Sophisticated Bidding System with Real-time Updates
- Curated Marketplace (The Emporium)
- Comprehensive Data Analytics
- White-Glove Consignment Services
- Robust Security Features
- Community Hub and Expert Content

## Tech Stack

- Next.js 14 with TypeScript
- Tailwind CSS for styling
- Prisma with PostgreSQL
- NextAuth.js for authentication
- Socket.io for real-time features
- React Query for data fetching
- Zod for validation

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

3. Initialize the database:
```bash
npx prisma db push
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
├── app/                 # Next.js 14 App Router
├── components/         # Reusable React components
├── lib/               # Utility functions and shared logic
├── prisma/           # Database schema and migrations
├── types/            # TypeScript type definitions
└── styles/           # Global styles and Tailwind config
```

## Contributing

Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting any changes.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details. 