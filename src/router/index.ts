import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/editor' },
  {
    path: '/editor',
    name: 'editor',
    component: () => import('@/pages/EditorPage.vue'),
    meta: { title: 'Редактор' },
  },
  {
    path: '/board',
    name: 'board',
    component: () => import('@/pages/BoardPage.vue'),
    meta: { title: 'Доска' },
  },
  {
    path: '/settings',
    name: 'settings',
    component: () => import('@/pages/SettingsPage.vue'),
    meta: { title: 'Настройки' },
  },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
