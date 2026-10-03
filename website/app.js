const chats = [
  {
    name: 'Arjun',
    avatar: 'A',
    color: 'a1',
    messages: ['hey! coffee after class?', 'the usual place? ☕'],
  },
  {
    name: 'Maya',
    avatar: 'M',
    color: 'a2',
    messages: ['look what I made :)', 'finally finished that little painting 🎨'],
  },
  {
    name: 'Study group',
    avatar: 'S',
    color: 'a3',
    messages: ['see you in the library', 'bring your notes. I’ll bring snacks.'],
  },
];
let selected = -1;
function clearReaction() {
  document.getElementById('reaction').hidden = true;
  document
    .querySelectorAll('.reactions button')
    .forEach((b) => b.setAttribute('aria-pressed', 'false'));
}
document.querySelectorAll('[data-chat]').forEach((button) =>
  button.addEventListener('click', () => {
    const index = Number(button.dataset.chat);
    if (selected === index) return;
    selected = index;
    const chat = chats[index];
    document.querySelectorAll('[data-chat]').forEach((b) => {
      b.classList.toggle('active', b === button);
      b.setAttribute('aria-pressed', String(b === button));
    });
    document.getElementById('thread-name').textContent = chat.name;
    const avatar = document.getElementById('thread-avatar');
    avatar.textContent = chat.avatar;
    avatar.className = `avatar ${chat.color}`;
    document.getElementById('message-one').textContent = chat.messages[0];
    document.getElementById('message-two').textContent = chat.messages[1];
    clearReaction();
    document.getElementById('demo-status').textContent =
      `Example conversation with ${chat.name} · no Instagram connection`;
  }),
);
document.querySelectorAll('.reactions button').forEach((button) =>
  button.addEventListener('click', () => {
    const remove = button.getAttribute('aria-pressed') === 'true';
    clearReaction();
    if (!remove) {
      button.setAttribute('aria-pressed', 'true');
      const reaction = document.getElementById('reaction');
      reaction.textContent = button.textContent;
      reaction.hidden = false;
    }
    document.getElementById('demo-status').textContent = remove
      ? 'Demo reaction removed · no Instagram connection'
      : 'Demo reaction added · no Instagram connection';
  }),
);
document.getElementById('copy-address')?.addEventListener('click', async () => {
  const status = document.getElementById('copy-status');
  try {
    await navigator.clipboard.writeText('chrome://extensions');
    status.textContent = 'Copied. Paste into your address bar.';
  } catch {
    status.textContent = 'Copy manually: chrome://extensions';
  }
});

// Buttons become available only after their handlers are mounted. Downloads work without JavaScript.
document.querySelectorAll('button').forEach((button) => (button.disabled = false));
