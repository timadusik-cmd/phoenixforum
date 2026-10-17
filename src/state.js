// Phoenix RP Forum - Global State Management

export const state = {
  user: null,
  categories: [],
  recentThreads: [],
  unreadNotifications: 0,
  unreadMessages: 0,
  activeCategorySlug: null,
  activeModal: null, // null | 'auth' | 'profile' | 'report' | 'serverConnect' | 'servers' | 'shop' | 'editThread' | 'startConversation'
  modalContext: null, // Any contextual data passed to active modal
  authTab: 'login', // 'login' | 'register'
  authError: null,
  reportContext: null, // { postId, threadId }
  isLoading: false
};

const listeners = new Set();

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notifyStateChange() {
  listeners.forEach(fn => fn(state));
}
