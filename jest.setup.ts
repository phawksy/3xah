// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Mock next/router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '',
    query: {},
    asPath: '',
    push: jest.fn() as jest.Mock,
    replace: jest.fn() as jest.Mock,
    reload: jest.fn() as jest.Mock,
    back: jest.fn() as jest.Mock,
    prefetch: jest.fn() as jest.Mock,
    beforePopState: jest.fn() as jest.Mock,
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
  })
}))

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => { // Use any or a more specific ImageProps type if available
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />;
  },
}))

// Mock next/navigation (App Router hooks)
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn() as jest.Mock,
    replace: jest.fn() as jest.Mock,
    prefetch: jest.fn() as jest.Mock,
    back: jest.fn() as jest.Mock,
    forward: jest.fn() as jest.Mock,
  }),
  usePathname: () => '' as string,
  useSearchParams: () => new URLSearchParams() as URLSearchParams,
  redirect: jest.fn() as jest.Mock,
}))

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: () => ({ data: null, status: 'unauthenticated' }) as any, // Use Session type if available
  signIn: jest.fn() as jest.Mock,
  signOut: jest.fn() as jest.Mock,
})) 