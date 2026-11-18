/* Заполняется только адресом опубликованной функции. Секретов здесь нет. */
window.ADMV_ADMIN_ENDPOINT = 'https://admv-admin.onrender.com/admin';
const AdminServer = (() => {
  let session = null;
  const enabled = () => /^https:\/\/[a-z0-9.-]+\/admin$/i.test(window.ADMV_ADMIN_ENDPOINT || '');
  const active = () => enabled() && session && session.expires > Date.now();
  async function request(action, payload = {}, credential = session) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), action === 'publish' ? 120000 : action === 'login' ? 90000 : 20000);
    try {
      const response = await fetch(window.ADMV_ADMIN_ENDPOINT, {
        method: 'POST', signal: controller.signal, cache: 'no-store',
        headers: {'Content-Type': 'application/json', ...(credential ? {Authorization: 'Bearer ' + credential.token} : {})},
        body: JSON.stringify({action, ...payload})
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401 && action !== 'login' && session === credential) session = null;
        throw new Error(data.error || 'Сервер временно недоступен. Черновик сохранён.');
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Сервер долго не отвечает. Черновик сохранён. Проверьте состояние сайта перед повторной публикацией.');
      if (error instanceof TypeError) throw new Error('Нет связи с сервером. Проверьте интернет. Черновик сохранён.');
      throw error;
    } finally { clearTimeout(timer); }
  }
  async function login(username, password) {
    session = null;
    const result = await request('login', {username: username.trim(), password});
    if (!result.token || !Number.isFinite(result.expires)) throw new Error('Сервер не подтвердил вход.');
    session = {token: result.token, expires: result.expires * 1000};
  }
  async function logout() {
    const old = session; session = null;
    try { if (old) await request('logout', {}, old); } catch (_) {}
  }
  return {enabled, active, login, logout, request};
})();
