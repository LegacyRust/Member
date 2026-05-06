const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSn4KTBbFaukJpcFxWRvqgqqu2rRzsEn_3wvB_iSV9Ti8cePLVOvW1I9U-LIOBEvK4QLTjpqqPX-04U/pub?gid=0&single=true&output=csv";

const memberList = document.getElementById("memberList");
const staffList = document.getElementById("staffList");
const memberCount = document.getElementById("memberCount");
const staffCount = document.getElementById("staffCount");
const template = document.getElementById("cardTemplate");

main();

async function main() {
  try {
    const text = await fetch(CSV_URL, { cache: "no-store" }).then((res) => {
      if (!res.ok) throw new Error("CSVを読み込めませんでした");
      return res.text();
    });

    const rows = parseCSV(text);

    const people = rows
      .map(normalizeRow)
      .filter((row) => row.name);

    const members = people.filter((p) => p.type === "member");
    const staff = people.filter((p) => p.type === "staff");

    renderList(memberList, members, "参加者がまだ登録されていません。");
    renderList(staffList, staff, "運営がまだ登録されていません。");

    memberCount.textContent = members.length;
    staffCount.textContent = staff.length;

  } catch (error) {
    console.error(error);

    memberList.innerHTML = `<div class="empty">表示に失敗しました。</div>`;
    staffList.innerHTML = `<div class="empty">表示に失敗しました。</div>`;
  }
}

function normalizeRow(row) {
  return {
    type: clean(row.type).toLowerCase(),
    name: clean(row.name),
    icon: clean(row.icon),
    x: clean(row.x),
    twitch: clean(row.twitch),
    youtube: clean(row.youtube),
    kick: clean(row.kick),
    discord: clean(row.discord),
    live: isLiveValue(row.live || row.Live || row.LIVE)
  };
}

function isLiveValue(value) {
  const v = clean(value).toLowerCase();

  return (
    v === "yes" ||
    v === "true" ||
    v === "1" ||
    v === "live" ||
    v === "配信中"
  );
}

function clean(value) {
  return String(value || "").trim();
}

function renderList(target, items, emptyText) {

  target.innerHTML = "";

  if (!items.length) {
    target.innerHTML = `<div class="empty">${emptyText}</div>`;
    return;
  }

  for (const item of items) {

    const node = template.content.cloneNode(true);

    const card = node.querySelector(".card");
    const img = node.querySelector(".avatar");
    const name = node.querySelector(".name");
    const links = node.querySelector(".links");

    if (item.live) {
      card.classList.add("is-live");
    }

    img.src = item.icon || defaultIcon(item.name);

    img.alt = item.name;

    img.onerror = () => {
      img.src = defaultIcon(item.name);
    };

    name.textContent = item.name;

    addLink(
      links,
      '<i class="fa-brands fa-x-twitter"></i>',
      item.x,
      "x"
    );

    addLink(
      links,
      '<i class="fa-brands fa-twitch"></i>',
      item.twitch,
      "twitch"
    );

    addLink(
      links,
      '<i class="fa-brands fa-youtube"></i>',
      item.youtube,
      "youtube"
    );

    addLink(
      links,
      '<i class="fa-brands fa-kickstarter-k"></i>',
      item.kick,
      "kick"
    );

    addLink(
      links,
      '<i class="fa-brands fa-discord"></i>',
      item.discord,
      "discord"
    );

    target.appendChild(node);
  }
}

function addLink(target, labelHtml, url, className = "") {

  if (!url) return;

  const a = document.createElement("a");

  a.className = `link ${className}`.trim();

  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";

  a.innerHTML = labelHtml;

  target.appendChild(a);
}

function defaultIcon(name) {

  const initial = encodeURIComponent(
    (name || "?").slice(0, 1).toUpperCase()
  );

  return `https://placehold.co/512x512/202631/f4f7fb?text=${initial}`;
}

function parseCSV(csvText) {

  const rows = [];

  let row = [];
  let value = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {

    const char = csvText[i];
    const next = csvText[i + 1];

    if (char === '"' && insideQuotes && next === '"') {

      value += '"';
      i++;

    } else if (char === '"') {

      insideQuotes = !insideQuotes;

    } else if (char === "," && !insideQuotes) {

      row.push(value);
      value = "";

    } else if ((char === "\n" || char === "\r") && !insideQuotes) {

      if (char === "\r" && next === "\n") i++;

      row.push(value);
      rows.push(row);

      row = [];
      value = "";

    } else {

      value += char;
    }
  }

  if (value || row.length) {

    row.push(value);
    rows.push(row);
  }

  const header = rows.shift()?.map((h) => h.trim()) || [];

  return rows
    .filter((r) =>
      r.some((cell) => String(cell).trim() !== "")
    )
    .map((r) => {

      const obj = {};

      header.forEach((key, index) => {
        obj[key] = r[index] || "";
      });

      return obj;
    });
}
