// Phoenix RP Forum - Official Rules Page
import { ICONS } from '../utils/icons.js';

export function renderRulesPage() {
  return `
    <div class="main-content">
      <!-- Breadcrumbs -->
      <div class="breadcrumbs">
        <a href="/forum" data-link class="breadcrumb-item">${ICONS.home} Главная</a>
        <span class="breadcrumb-separator">›</span>
        <a href="/forum" data-link class="breadcrumb-item">Форум</a>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">Правила проекта</span>
      </div>

      <div class="rules-page-header">
        <div class="rules-icon-wrap">${ICONS.shield}</div>
        <div>
          <h1 class="rules-title">Официальный свод правил PHOENIX PROJECT RP</h1>
          <p class="rules-subtitle">Действующий регламент поведения на сервере и форуме. Незнание правил не освобождает от ответственности.</p>
        </div>
      </div>

      <div class="rules-accordion-list">
        <!-- Section 1 -->
        <div class="rule-card">
          <div class="rule-card-header">
            <h3>1. Основные термины и понятия RolePlay</h3>
          </div>
          <div class="rule-card-body">
            <ul>
              <li><strong>Deathmatch (DM)</strong> — убийство или нанесение телесных повреждений персонажу без весомой игровой (IC) причины. <em>Наказание: Demorgan 60-120 минут.</em></li>
              <li><strong>DriveBy (DB)</strong> — намеренное убийство или нанесение урона персонажам с использованием транспортного средства. <em>Наказание: Demorgan 60-120 минут.</em></li>
              <li><strong>Metagaming (MG)</strong> — использование информации из реального мира (OOC/Discord) в игровом чате или действиях (IC). <em>Наказание: Mute 30-60 минут.</em></li>
              <li><strong>Powergaming (PG)</strong> — преувеличение физических возможностей персонажа (например, нападение в одиночку на 3-х вооруженных полицейских). <em>Наказание: Demorgan 60 минут.</em></li>
              <li><strong>Spawn Kill (SK)</strong> — убийство игроков на месте их появления / спавна организации. <em>Наказание: Warn / Demorgan 120 минут.</em></li>
              <li><strong>Repeat Kill (RK)</strong> — возвращение на место своей смерти в течение 15 минут или месть убийце. <em>Наказание: Demorgan 60 минут.</em></li>
            </ul>
          </div>
        </div>

        <!-- Section 2 -->
        <div class="rule-card">
          <div class="rule-card-header">
            <h3>2. Правила поведения на форуме Phoenix RP</h3>
          </div>
          <div class="rule-card-body">
            <ul>
              <li><strong>2.1. Неуважение и оскорбления:</strong> Запрещены оскорбления пользователей, разжигание межнациональной розни, упоминание родных в негативном ключе. <em>Блокировка аккаунта от 7 до 30 дней.</em></li>
              <li><strong>2.2. Спам и оффтоп:</strong> Публикация бессмысленных сообщений, дублирование тем и написание ответов, не относящихся к теме раздела, запрещены.</li>
              <li><strong>2.3. Реклама:</strong> Любая несанкционированная реклама сторонних серверов, ресурсов или каналов карается перманентной блокировкой.</li>
              <li><strong>2.4. Мультиаккаунты:</strong> Запрещено создание нескольких аккаунтов для накрутки репутации или обхода блокировок.</li>
            </ul>
          </div>
        </div>

        <!-- Section 3 -->
        <div class="rule-card">
          <div class="rule-card-header">
            <h3>3. Правила подачи жалоб</h3>
          </div>
          <div class="rule-card-body">
            <ul>
              <li>Срок подачи жалобы составляет не более <strong>48 часов</strong> с момента нарушения.</li>
              <li>Видеодоказательства должны быть загружены на YouTube или Rutube в хорошем качестве (от 720p). Скриншоты с оскорблениями принимаются на Imgur или форуме.</li>
              <li>Жалобы, составленные не по форме или содержащие нецензурную брань в адрес администрации/игроков, рассмотрению не подлежат.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}
