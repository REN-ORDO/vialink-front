import type { ReactElement, ReactNode } from 'react';
import { render, renderHook, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function queryWrapper({ children }: { children: ReactNode }) {
  const client = createTestQueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

type ProvidersOptions = {
  withRouter?: boolean;
  initialEntries?: string[];
};

function AllProviders({
  children,
  withRouter = true,
  initialEntries = ['/'],
}: {
  children: ReactNode;
} & ProvidersOptions) {
  const client = createTestQueryClient();
  const tree = (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  if (!withRouter) return tree;
  return <MemoryRouter initialEntries={initialEntries}>{tree}</MemoryRouter>;
}

export function renderWithProviders(
  ui: ReactElement,
  opts: Omit<RenderOptions, 'wrapper'> & ProvidersOptions = {},
) {
  const { withRouter, initialEntries, ...rest } = opts;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders withRouter={withRouter} initialEntries={initialEntries}>
        {children}
      </AllProviders>
    ),
    ...rest,
  });
}

export function renderHookWithProviders<TResult, TProps>(
  callback: (props: TProps) => TResult,
  opts: { initialProps?: TProps } & ProvidersOptions = {},
) {
  const { withRouter, initialEntries, initialProps } = opts;
  return renderHook(callback, {
    wrapper: ({ children }) => (
      <AllProviders withRouter={withRouter} initialEntries={initialEntries}>
        {children}
      </AllProviders>
    ),
    initialProps,
  });
}
