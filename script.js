/*
 * ================================================================
 * #BoraReciclar — script.js
 * Escola Benjamin Constant • Pará
 *
 * JavaScript principal do protótipo.
 * Compatível com a estrutura de index.html e os estados definidos
 * em styles.css. Não depende de backend: os dados de demonstração
 * ficam no localStorage do navegador.
 * ================================================================
 */

(() => {
    "use strict";

    const STORAGE = {
        USER: "borareciclar.user",
        COLLECTOR: "borareciclar.collector",
        MUSIC: "borareciclar.music",
        MATERIAL: "borareciclar.material"
    };

    const SECTION_IDS = [
        "home-section",
        "como-funciona-section",
        "pontos-de-coleta-section",
        "creditos-section",
        "perfil-section",
        "usuario-cadastro-section",
        "coletor-cadastro-section"
    ];

    const DEFAULT_SECTION = "home-section";

    const state = {
        activeSection: DEFAULT_SECTION,
        materialFilter: "Todos",
        searchTerm: "",
        user: loadJSON(STORAGE.USER),
        collector: loadJSON(STORAGE.COLLECTOR),
        musicEnabled: localStorage.getItem(STORAGE.MUSIC) === "true"
    };

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function loadJSON(key) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    function saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch {
            // O site continua funcionando mesmo quando o localStorage
            // estiver indisponível.
        }
    }

    function escapeHTML(value) {
        return String(value ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function showToast(message, type = "success", duration = 3000) {
        const toast = $("#toast-notification");
        if (!toast) return;

        const paragraph = $("p", toast);
        if (paragraph) paragraph.textContent = message;

        toast.classList.remove("hidden", "show");
        toast.dataset.type = type;

        // Força o navegador a reconhecer o estado inicial antes da entrada.
        requestAnimationFrame(() => toast.classList.add("show"));

        window.clearTimeout(showToast.timer);
        showToast.timer = window.setTimeout(() => {
            toast.classList.remove("show");
            window.setTimeout(() => toast.classList.add("hidden"), 260);
        }, duration);
    }

    function setActiveNav(sectionId) {
        $$(".nav-button").forEach((button) => {
            const isTarget = button.dataset.section === sectionId;

            button.setAttribute("aria-current", isTarget ? "page" : "false");

            // Mantém a aparência original e cria um pequeno estado visual
            // sem depender de uma classe específica do Tailwind.
            if (isTarget && button.closest("#main-nav")) {
                button.classList.add("ring-4", "ring-white/30");
            } else {
                button.classList.remove("ring-4", "ring-white/30");
            }
        });
    }

    function updateURL(sectionId, replace = false) {
        const hash = sectionId === DEFAULT_SECTION ? "" : `#${sectionId.replace("-section", "")}`;

        try {
            const method = replace ? "replaceState" : "pushState";
            window.history[method](
                { section: sectionId },
                "",
                `${window.location.pathname}${hash}${window.location.search}`
            );
        } catch {
            // Em ambientes que bloqueiam history API, a navegação continua.
        }
    }

    function navigateTo(sectionId, options = {}) {
        const {
            updateHistory = true,
            scroll = true,
            focus = true,
            replace = false
        } = options;

        if (!SECTION_IDS.includes(sectionId)) {
            sectionId = DEFAULT_SECTION;
        }

        const current = $(`#${sectionId}`);
        if (!current) return;

        SECTION_IDS.forEach((id) => {
            const section = $(`#${id}`);
            if (!section) return;

            if (id === sectionId) {
                section.classList.remove("hidden", "section-hidden");
                section.setAttribute("aria-hidden", "false");
            } else {
                section.classList.add("section-hidden");
                section.setAttribute("aria-hidden", "true");
                window.setTimeout(() => {
                    if (state.activeSection !== id) {
                        section.classList.add("hidden");
                    }
                }, 220);
            }
        });

        state.activeSection = sectionId;
        setActiveNav(sectionId);

        if (updateHistory) updateURL(sectionId, replace);

        if (scroll) {
            const container = $("#sections-container");
            window.setTimeout(() => {
                (container || current).scrollIntoView({
                    behavior: prefersReducedMotion() ? "auto" : "smooth",
                    block: "start"
                });
            }, 30);
        }

        if (focus) {
            window.setTimeout(() => {
                const heading = current.querySelector("h1, h2, [aria-labelledby]");
                if (heading && typeof heading.focus === "function") {
                    if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
                    heading.focus({ preventScroll: true });
                }
            }, 260);
        }

        if (sectionId === "perfil-section") renderProfile();
    }

    function prefersReducedMotion() {
        return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    }

    function resolveInitialSection() {
        const rawHash = window.location.hash.replace(/^#/, "").trim();
        if (!rawHash) return DEFAULT_SECTION;

        const normalized = rawHash.endsWith("-section")
            ? rawHash
            : `${rawHash}-section`;

        return SECTION_IDS.includes(normalized) ? normalized : DEFAULT_SECTION;
    }

    function setupNavigation() {
        $$("[data-section]").forEach((button) => {
            button.addEventListener("click", () => {
                navigateTo(button.dataset.section);
            });
        });

        const logo = $("#logo");
        if (logo) {
            logo.addEventListener("click", () => navigateTo(DEFAULT_SECTION));
        }

        window.addEventListener("popstate", () => {
            navigateTo(resolveInitialSection(), {
                updateHistory: false,
                scroll: true,
                focus: false
            });
        });

        const nav = $("#main-nav");
        if (nav) {
            nav.addEventListener("keydown", (event) => {
                if (event.key !== "ArrowRight" && event.key !== "ArrowDown" &&
                    event.key !== "ArrowLeft" && event.key !== "ArrowUp") return;

                const buttons = $$(".nav-button", nav);
                const currentIndex = buttons.indexOf(document.activeElement);
                if (currentIndex < 0) return;

                event.preventDefault();

                const direction =
                    event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;

                const nextIndex = (currentIndex + direction + buttons.length) % buttons.length;
                buttons[nextIndex].focus();
            });
        }
    }

    function setupUserMenu() {
        const menuButton = $("#user-menu-button");
        const menu = $("#user-menu");
        if (!menuButton || !menu) return;

        function renderMenu() {
            if (state.user?.name) {
                menu.innerHTML = `
                    <div class="border-b border-slate-100 px-4 py-3">
                        <p class="text-xs font-bold uppercase tracking-wider text-slate-400">Conectado como</p>
                        <p class="mt-1 truncate font-black text-slate-800">${escapeHTML(state.user.name)}</p>
                        <p class="truncate text-sm text-slate-500">${escapeHTML(state.user.email || "")}</p>
                    </div>
                    <div class="p-2">
                        <button type="button" data-menu-action="profile"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">
                            <i class="fas fa-user text-emerald-700" aria-hidden="true"></i>
                            Meu perfil
                        </button>
                        <button type="button" data-menu-action="collector"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">
                            <i class="fas fa-truck text-amber-700" aria-hidden="true"></i>
                            Quero ser coletor
                        </button>
                        <button type="button" data-menu-action="logout"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold text-red-700 hover:bg-red-50">
                            <i class="fas fa-right-from-bracket" aria-hidden="true"></i>
                            Sair
                        </button>
                    </div>
                `;
            } else {
                menu.innerHTML = `
                    <div class="p-2">
                        <button type="button" data-menu-action="login"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">
                            <i class="fas fa-user-plus text-emerald-700" aria-hidden="true"></i>
                            Criar / entrar
                        </button>
                        <button type="button" data-menu-action="collector"
                            class="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left font-semibold hover:bg-slate-100">
                            <i class="fas fa-truck text-amber-700" aria-hidden="true"></i>
                            Quero ser coletor
                        </button>
                    </div>
                `;
            }
        }

        function setOpen(open) {
            menu.classList.toggle("hidden", !open);
            menuButton.setAttribute("aria-expanded", String(open));
        }

        renderMenu();
        menuButton.setAttribute("aria-expanded", "false");

        menuButton.addEventListener("click", (event) => {
            event.stopPropagation();
            const isOpen = !menu.classList.contains("hidden");
            setOpen(!isOpen);
        });

        menu.addEventListener("click", (event) => {
            const actionButton = event.target.closest("[data-menu-action]");
            if (!actionButton) return;

            const action = actionButton.dataset.menuAction;

            if (action === "profile") {
                navigateTo("perfil-section");
            } else if (action === "collector") {
                navigateTo("coletor-cadastro-section");
            } else if (action === "login") {
                navigateTo("usuario-cadastro-section");
            } else if (action === "logout") {
                state.user = null;
                localStorage.removeItem(STORAGE.USER);
                renderMenu();
                renderProfile();
                showToast("Você saiu da demonstração.");
            }

            setOpen(false);
        });

        document.addEventListener("click", (event) => {
            if (!menu.contains(event.target) && !menuButton.contains(event.target)) {
                setOpen(false);
            }
        });

        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") setOpen(false);
        });

        return { renderMenu };
    }

    function renderProfile() {
        const section = $("#perfil-section");
        if (!section) return;

        const box = section.firstElementChild;
        if (!box) return;

        if (!state.user) {
            box.innerHTML = `
                <div class="mx-auto max-w-3xl text-center">
                    <span class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                        <i class="fas fa-user" aria-hidden="true"></i>
                    </span>
                    <h2 id="perfil-title" tabindex="-1" class="mt-5 text-3xl font-black">Seu perfil</h2>
                    <p class="mt-3 text-slate-600">
                        Crie um cadastro de demonstração para visualizar seu perfil e acompanhar sua participação.
                    </p>
                    <button type="button" data-section="usuario-cadastro-section"
                        class="nav-button focus-ring mt-7 rounded-2xl bg-emerald-600 px-6 py-4 font-black text-white shadow-md hover:bg-emerald-700">
                        <i class="fas fa-user-plus mr-2" aria-hidden="true"></i>
                        Criar cadastro
                    </button>
                </div>
            `;

            const button = $("[data-section]", box);
            button?.addEventListener("click", () => navigateTo(button.dataset.section));
            return;
        }

        const name = escapeHTML(state.user.name);
        const email = escapeHTML(state.user.email);
        const joinedAt = state.user.createdAt
            ? new Intl.DateTimeFormat("pt-BR", {
                dateStyle: "long"
            }).format(new Date(state.user.createdAt))
            : "Agora";

        const collectorName = state.collector?.name
            ? escapeHTML(state.collector.name)
            : null;

        box.innerHTML = `
            <div class="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div>
                    <span class="inline-flex rounded-full bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-800">
                        Perfil de participante
                    </span>
                    <h2 id="perfil-title" tabindex="-1" class="mt-4 text-3xl font-black md:text-4xl">
                        Olá, ${name}! 🌱
                    </h2>
                    <p class="mt-2 text-slate-600">${email}</p>
                </div>
                <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-2xl font-black text-white shadow-lg">
                    ${escapeHTML((state.user.name || "B").trim().charAt(0).toUpperCase())}
                </div>
            </div>

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
                <div class="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-100">
                    <span class="text-xs font-bold uppercase tracking-wider text-emerald-700">Participação</span>
                    <strong class="mt-2 block text-3xl text-emerald-900">Ativa</strong>
                    <span class="mt-1 block text-sm text-emerald-800">Conta local de demonstração</span>
                </div>
                <div class="rounded-2xl bg-sky-50 p-5 ring-1 ring-sky-100">
                    <span class="text-xs font-bold uppercase tracking-wider text-sky-700">Cadastro</span>
                    <strong class="mt-2 block text-xl text-sky-900">${joinedAt}</strong>
                    <span class="mt-1 block text-sm text-sky-800">Data de entrada</span>
                </div>
                <div class="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-100">
                    <span class="text-xs font-bold uppercase tracking-wider text-amber-700">Coleta</span>
                    <strong class="mt-2 block text-xl text-amber-900">
                        ${collectorName ? "Coletor cadastrado" : "Ainda não"}
                    </strong>
                    <span class="mt-1 block text-sm text-amber-800">
                        ${collectorName ? `Atuação: ${escapeHTML(state.collector.area)}` : "Você pode participar como coletor"}
                    </span>
                </div>
            </div>

            <div class="mt-8 rounded-2xl border-l-4 border-emerald-600 bg-slate-50 p-5">
                <h3 class="font-black">Próximo passo</h3>
                <p class="mt-2 text-sm leading-relaxed text-slate-600">
                    Encontre um ponto de coleta próximo e transforme sua participação em uma ação concreta.
                </p>
                <button type="button" data-profile-action="map"
                    class="focus-ring mt-4 rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-800">
                    <i class="fas fa-map-marker-alt mr-2" aria-hidden="true"></i>
                    Encontrar ponto
                </button>
            </div>
        `;

        $("[data-profile-action='map']", box)?.addEventListener("click", () => {
            navigateTo("pontos-de-coleta-section");
        });
    }

    function setupUserForm(menuApi) {
        const form = $("#demo-user-form");
        if (!form) return;

        const nameInput = $("#demo-name");
        const emailInput = $("#demo-email");

        if (state.user) {
            nameInput.value = state.user.name || "";
            emailInput.value = state.user.email || "";
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();

            if (name.length < 2) {
                nameInput.focus();
                showToast("Digite seu nome para continuar.", "error");
                return;
            }

            if (!emailInput.checkValidity()) {
                emailInput.focus();
                showToast("Digite um e-mail válido.", "error");
                return;
            }

            state.user = {
                name,
                email,
                createdAt: state.user?.createdAt || new Date().toISOString()
            };

            saveJSON(STORAGE.USER, state.user);
            menuApi?.renderMenu?.();
            renderProfile();

            showToast(`Cadastro salvo. Bem-vindo(a), ${name}!`);

            window.setTimeout(() => navigateTo("perfil-section"), 500);
        });
    }

    function setupCollectorForm(menuApi) {
        const form = $("#demo-collector-form");
        if (!form) return;

        const nameInput = $("#collector-name");
        const areaInput = $("#collector-area");

        if (state.collector) {
            nameInput.value = state.collector.name || "";
            areaInput.value = state.collector.area || "";
        }

        form.addEventListener("submit", (event) => {
            event.preventDefault();

            const name = nameInput.value.trim();
            const area = areaInput.value.trim();

            if (name.length < 2) {
                nameInput.focus();
                showToast("Digite o nome do coletor.", "error");
                return;
            }

            if (area.length < 2) {
                areaInput.focus();
                showToast("Informe a região de atuação.", "error");
                return;
            }

            state.collector = {
                name,
                area,
                createdAt: new Date().toISOString()
            };

            saveJSON(STORAGE.COLLECTOR, state.collector);
            renderProfile();

            if (state.user) {
                menuApi?.renderMenu?.();
                showToast("Cadastro de coletor salvo com sucesso!");
                window.setTimeout(() => navigateTo("perfil-section"), 500);
            } else {
                showToast("Cadastro de coletor salvo nesta demonstração.");
            }
        });
    }

    function setupCollectionFilters() {
        const section = $("#pontos-de-coleta-section");
        if (!section) return;

        const input = section.querySelector('input[type="search"]');
        const filterButton = section.querySelector("button:not(.nav-button)");
        const chips = $$("button", section).filter((button) => {
            const text = button.textContent.trim();
            return ["♻️ Todos", "Papel", "Plástico", "Vidro", "Metal", "Eletrônicos"]
                .some((label) => text.includes(label));
        });

        let filterPanel = null;

        function setChipVisual(activeButton) {
            chips.forEach((chip) => {
                const active = chip === activeButton;
                chip.classList.toggle("bg-emerald-100", active);
                chip.classList.toggle("text-emerald-800", active);
                chip.classList.toggle("font-bold", active);

                if (!active) {
                    chip.classList.add("bg-slate-100");
                } else {
                    chip.classList.remove("bg-slate-100");
                }
            });
        }

        function updateSearch() {
            state.searchTerm = input?.value.trim() || "";

            const term = state.searchTerm
                ? ` "${state.searchTerm}"`
                : "";

            const material = state.materialFilter !== "Todos"
                ? ` para ${state.materialFilter.toLowerCase()}`
                : "";

            if (state.searchTerm || state.materialFilter !== "Todos") {
                showToast(`Busca preparada${term}${material}. O mapa mostra resultados da região.`);
            }
        }

        chips.forEach((chip) => {
            chip.addEventListener("click", () => {
                const label = chip.textContent.replace("♻️", "").trim() || "Todos";
                state.materialFilter = label === "Todos" ? "Todos" : label;
                localStorage.setItem(STORAGE.MATERIAL, state.materialFilter);
                setChipVisual(chip);
                updateSearch();
            });
        });

        if (input) {
            input.addEventListener("search", updateSearch);
            input.addEventListener("keydown", (event) => {
                if (event.key === "Enter") {
                    event.preventDefault();
                    updateSearch();
                }
            });
        }

        if (filterButton) {
            filterButton.addEventListener("click", () => {
                if (!filterPanel) {
                    filterPanel = document.createElement("div");
                    filterPanel.className =
                        "mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4";
                    filterPanel.innerHTML = `
                        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p class="font-black text-slate-900">Filtros da demonstração</p>
                                <p class="text-sm text-slate-600">
                                    Escolha um material ou pesquise uma região no campo acima.
                                </p>
                            </div>
                            <button type="button" data-clear-filters
                                class="focus-ring rounded-xl bg-white px-4 py-2 text-sm font-bold ring-1 ring-slate-200 hover:bg-slate-100">
                                Limpar filtros
                            </button>
                        </div>
                        <div class="mt-3 flex flex-wrap gap-2">
                            <span data-filter-summary
                                class="rounded-full bg-white px-3 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200">
                                Todos os materiais
                            </span>
                        </div>
                    `;
                    section.querySelector(".mt-4.flex.flex-wrap")?.after(filterPanel);

                    filterPanel.querySelector("[data-clear-filters]")?.addEventListener("click", () => {
                        state.materialFilter = "Todos";
                        state.searchTerm = "";
                        if (input) input.value = "";
                        const allChip = chips.find((chip) => chip.textContent.includes("Todos"));
                        if (allChip) setChipVisual(allChip);
                        updateFilterSummary();
                        showToast("Filtros limpos.");
                    });
                }

                filterPanel.classList.toggle("hidden");
                updateFilterSummary();
            });
        }

        function updateFilterSummary() {
            if (!filterPanel) return;

            const summary = filterPanel.querySelector("[data-filter-summary]");
            if (!summary) return;

            const material = state.materialFilter === "Todos"
                ? "Todos os materiais"
                : `Material: ${state.materialFilter}`;

            summary.textContent = state.searchTerm
                ? `${material} • Busca: ${state.searchTerm}`
                : material;
        }

        const persistedMaterial = localStorage.getItem(STORAGE.MATERIAL);
        if (persistedMaterial) {
            state.materialFilter = persistedMaterial;
            const matchingChip = chips.find((chip) =>
                chip.textContent.replace("♻️", "").trim() === persistedMaterial
            );
            if (matchingChip) setChipVisual(matchingChip);
        }
    }

    function setupMusic() {
        const audio = $("#background-music");
        const button = $("#music-toggle");
        if (!audio || !button) return;

        const icon = $("i", button);

        function updateUI(playing) {
            button.setAttribute("aria-label", playing ? "Pausar música" : "Ativar música");
            button.setAttribute("title", playing ? "Pausar música" : "Ativar música");

            if (icon) {
                icon.classList.toggle("fa-play", !playing);
                icon.classList.toggle("fa-pause", playing);
            }
        }

        function pause() {
            audio.pause();
            state.musicEnabled = false;
            localStorage.setItem(STORAGE.MUSIC, "false");
            updateUI(false);
        }

        updateUI(false);

        button.addEventListener("click", async () => {
            if (!audio.src) {
                showToast("Arquivo de música não encontrado.", "error");
                return;
            }

            if (!audio.paused) {
                pause();
                return;
            }

            try {
                await audio.play();
                state.musicEnabled = true;
                localStorage.setItem(STORAGE.MUSIC, "true");
                updateUI(true);
            } catch {
                showToast("O navegador bloqueou a reprodução automática. Toque novamente para tentar.", "error");
            }
        });

        audio.addEventListener("play", () => updateUI(true));
        audio.addEventListener("pause", () => updateUI(false));
        audio.addEventListener("ended", () => updateUI(false));
    }

    function setupSocialLinks() {
        const youtube = $("#youtube-link");
        const instagram = $("#instagram-link");

        [youtube, instagram].forEach((link) => {
            if (!link) return;

            link.addEventListener("click", (event) => {
                if (link.getAttribute("href") === "#") {
                    event.preventDefault();
                    showToast("Este link está reservado para a rede oficial do projeto.");
                }
            });
        });
    }

    function setupKeyboardShortcuts() {
        document.addEventListener("keydown", (event) => {
            const activeTag = document.activeElement?.tagName?.toLowerCase();
            const typing = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

            if (typing) return;

            if (event.key === "h" || event.key === "H") {
                navigateTo(DEFAULT_SECTION);
            }

            if (event.key === "m" || event.key === "M") {
                $("#music-toggle")?.click();
            }

            if (event.key === "/" && $("#pontos-de-coleta-section") && state.activeSection === "pontos-de-coleta-section") {
                event.preventDefault();
                $("#pontos-de-coleta-section input[type='search']")?.focus();
            }
        });
    }

    function initializeAccessibility() {
        SECTION_IDS.forEach((id) => {
            const section = $(`#${id}`);
            if (!section) return;

            const isVisible = !section.classList.contains("hidden");
            section.setAttribute("aria-hidden", String(!isVisible));
        });
    }

    function init() {
        const menuApi = setupUserMenu();

        setupNavigation();
        setupUserForm(menuApi);
        setupCollectorForm(menuApi);
        setupCollectionFilters();
        setupMusic();
        setupSocialLinks();
        setupKeyboardShortcuts();

        initializeAccessibility();
        renderProfile();

        const initialSection = resolveInitialSection();
        navigateTo(initialSection, {
            updateHistory: Boolean(window.location.hash),
            replace: true,
            scroll: false,
            focus: false
        });

        if (state.user) {
            // Mantém o cabeçalho atualizado caso o usuário tenha sido
            // salvo em uma sessão anterior.
            menuApi?.renderMenu?.();
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
