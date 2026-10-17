// Phoenix RP Forum - SPA Router

export class Router {
  constructor() {
    this.routes = [];
    this.currentRoute = null;
    this.params = {};
    this.query = {};

    window.addEventListener('popstate', () => {
      this.resolve();
    });

    // Intercept clicks on links with data-link attribute
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigate(href);
      }
    });
  }

  addRoute(pattern, handler) {
    // Convert /forum/category/:slug to regex
    const paramNames = [];
    const regexPattern = pattern
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      })
      .replace(/\//g, '\\/');

    const regex = new RegExp(`^${regexPattern}$`);
    this.routes.push({ pattern, regex, paramNames, handler });
  }

  navigate(path) {
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    this.resolve();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resolve() {
    const pathname = window.location.pathname === '/' ? '/forum' : window.location.pathname;
    const search = window.location.search;

    // Parse query params
    this.query = {};
    if (search) {
      const urlParams = new URLSearchParams(search);
      for (const [key, value] of urlParams.entries()) {
        this.query[key] = value;
      }
    }

    for (const route of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        this.params = {};
        route.paramNames.forEach((name, index) => {
          this.params[name] = decodeURIComponent(match[index + 1]);
        });

        this.currentRoute = route.pattern;
        route.handler(this.params, this.query);
        return;
      }
    }

    // Default fallback: /forum
    if (pathname !== '/forum') {
      this.navigate('/forum');
    }
  }
}

export const router = new Router();
