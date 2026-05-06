const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSn4KTBbFaukJpcFxWRvqgqqu2rRzsEn_3wvB_iSV9Ti8cePLVOvW1I9U-LIOBEvK4QLTjpqqPX-04U/pub?gid=0&single=true&output=csv";

const memberList = document.getElementById("memberList");
const staffList = document.getElementById("staffList");
const memberCount = document.getElementById("memberCount");
const staffCount = document.getElementById("staffCount");
const updatedAt = document.getElementById("updatedAt");
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
    updatedAt.textContent = "読み込み完了";
  } catch (error) {
    console.error(error);
    updatedAt.textContent = "読み込み失敗";
    memberList.innerHTML = `<div class="empty">CSVの読み込みに失敗しました。</div>`;
    staffList.innerHTML = `<div class="empty">CSVの読み込みに失敗しました。</div>`;
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
    discord: clean(row.discord)
  };
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

    img.src = item.icon || defaultIcon(item.name);
    img.alt = item.name;
    img.onerror = () => {
      img.src = defaultIcon(item.name);
    };

    name.textContent = item.name;

    addLink(links, "X", item.x);
    addLink(links, "Twitch", item.twitch, true);
    addLink(links, "YouTube", item.youtube, true);
    addLink(links, "Kick", item.kick, true);
    addLink(links, "Discord", item.discord, true);

    target.appendChild(node);
  }
}

function addLink(target, label, url, secondary = false) {
  if (!url) return;

  const a = document.createElement("a");
  a.className = secondary ? "link secondary" : "link";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.textContent = label;
  target.appendChild(a);
}

function defaultIcon(name) {
  const initial = encodeURIComponent((name || "?").slice(0, 1).toUpperCase());
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
    .filter((r) => r.some((cell) => String(cell).trim() !== ""))
    .map((r) => {
      const obj = {};
      header.forEach((key, index) => {
        obj[key] = r[index] || "";
      });
      return obj;
    });
}
