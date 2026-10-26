/**
 * Router.ts - Hash-baseret SPA router for Fotografiske Signaler (§4.1, §9.3)
 */

export interface RouteMatch {
  route: string;
  path: string;
  params: URLSearchParams;
  context?: any;
}

export type RouteListener = (match: RouteMatch) => void;

export class Router {
  private static listeners: Set<RouteListener> = new Set();
  private static pendingContext: any = null;

  public static init(): void {
    window.addEventListener('hashchange', () => this.handleHashChange());
    // Initial navigation
    if (!window.location.hash) {
      window.location.hash = '#/';
    } else {
      this.handleHashChange();
    }
  }

  public static subscribe(listener: RouteListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public static navigate(hash: string, context?: any): void {
    this.pendingContext = context;
    if (window.location.hash === hash) {
      this.handleHashChange();
    } else {
      window.location.hash = hash;
    }
  }

  private static handleHashChange(): void {
    const rawHash = window.location.hash || '#/';
    const [pathPart, queryPart] = rawHash.replace(/^#\/?/, '').split('?');
    const path = pathPart || '';
    const params = new URLSearchParams(queryPart || '');
    const context = this.pendingContext;
    this.pendingContext = null;

    const match: RouteMatch = {
      route: rawHash,
      path,
      params,
      context
    };

    this.listeners.forEach((listener) => {
      try {
        listener(match);
      } catch (err) {
        console.error('Fejl i route listener:', err);
      }
    });
  }
}
