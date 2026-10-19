// A local material comparison; switching keeps the current product and scroll.
const materials = [
  { id: 'wire', label: '雾蓝薄纸' },
  { id: 'paper', label: '实体纸壳' },
];

const control = document.createElement('div');
control.className = 'material-switch';
control.setAttribute('role', 'group');
control.setAttribute('aria-label', '材质方案');

const label = document.createElement('span');
label.className = 'material-switch-label';
label.textContent = '材质';
label.setAttribute('aria-hidden', 'true');
control.append(label);

const buttons = materials.map(material => {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'material-switch-button';
  button.dataset.material = material.id;
  button.textContent = material.label;
  button.setAttribute('aria-pressed', 'false');
  control.append(button);
  return button;
});

const status = document.createElement('span');
status.className = 'material-switch-status';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
status.setAttribute('aria-atomic', 'true');
control.append(status);

function materialFromURL() {
  return new URL(window.location.href).searchParams.get('material') === 'paper'
    ? 'paper'
    : 'wire';
}

function selectMaterial(id, { updateURL = true, announce = true } = {}) {
  const selected = materials.find(material => material.id === id) || materials[0];
  const changed = document.body.dataset.material !== selected.id;
  document.body.dataset.material = selected.id;
  buttons.forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.material === selected.id));
  });

  if (updateURL) {
    const url = new URL(window.location.href);
    if (selected.id === 'paper') url.searchParams.set('material', 'paper');
    else url.searchParams.delete('material');
    window.history.replaceState(window.history.state, '', url.href);
  }
  if (announce && changed) status.textContent = `已切换到${selected.label}`;
}

buttons.forEach(button => {
  button.addEventListener('click', () => selectMaterial(button.dataset.material));
});

control.addEventListener('keydown', event => {
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
  // Prevent the page's product arrow-key navigation from receiving this event.
  event.preventDefault();
  event.stopPropagation();
  const focusedIndex = buttons.indexOf(document.activeElement);
  const currentIndex = focusedIndex >= 0
    ? focusedIndex
    : materials.findIndex(material => material.id === document.body.dataset.material);
  const direction = event.key === 'ArrowRight' ? 1 : -1;
  const index = (currentIndex + direction + buttons.length) % buttons.length;
  selectMaterial(materials[index].id);
  buttons[index].focus({ preventScroll: true });
});

window.addEventListener('popstate', () => {
  selectMaterial(materialFromURL(), { updateURL: false, announce: false });
});

selectMaterial(materialFromURL(), { updateURL: false, announce: false });
document.body.append(control);
