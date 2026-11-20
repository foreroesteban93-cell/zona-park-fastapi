const API_URL = "/api/v1";

const sections = {
    dashboard: "Panel principal",
    customers: "Clientes",
    vehicles: "Vehículos",
    "parking-spaces": "Espacios de parqueo",
    rates: "Tarifas",
    "parking-sessions": "Sesiones de parqueo"
};

const content = document.getElementById("content");
const pageTitle = document.getElementById("page-title");
const connectionStatus = document.getElementById("connection-status");

let customers = [];
let vehicles = [];
let parkingSpaces = [];
let rates = [];
let parkingSessions = [];

async function checkApiConnection() {
    try {
        const response = await fetch("/openapi.json");
        if (!response.ok) throw new Error("API no disponible");

        connectionStatus.innerHTML =
            '<span class="status-dot" style="background:#22c55e"></span> API disponible';
    } catch (error) {
        connectionStatus.innerHTML =
            '<span class="status-dot" style="background:#ef4444"></span> API desconectada';
    }
}

function navigateTo(section) {
    if (!sections[section]) return;

    pageTitle.textContent = sections[section];

    document.querySelectorAll(".nav-button").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.section === section
        );
    });

    if (section === "dashboard") {
        showDashboard();
    } else if (section === "customers") {
        showCustomers();
    } else if (section === "vehicles") {
        showVehicles();
    } else if (section === "parking-spaces") {
        showParkingSpaces();
    } else if (section === "rates") {
        showRates();
    } else if (section === "parking-sessions") {
        showParkingSessions();
    } else {
        showModulePlaceholder(section);
    }
}

function showDashboard() {
    content.innerHTML = `
        <div class="welcome-card">
            <div>
                <span class="welcome-label">PANEL DE CONTROL</span>
                <h2>Bienvenido a ZonaPark</h2>
                <p>
                    Administra clientes, vehículos, espacios,
                    tarifas y sesiones de parqueo.
                </p>
            </div>
            <div class="welcome-icon">🅿️</div>
        </div>

        <div class="section-heading">
            <h3>Gestión del parqueadero</h3>
            <p>Selecciona un módulo para comenzar.</p>
        </div>

        <div class="dashboard-grid">
            ${Object.entries(sections)
                .filter(([key]) => key !== "dashboard")
                .map(([key, name]) => `
                    <article class="dashboard-card">
                        <h3>${name}</h3>
                        <p>Gestiona la información de este módulo.</p>
                        <button class="card-button" data-section="${key}">
                            Administrar →
                        </button>
                    </article>
                `).join("")}
        </div>
    `;
}

function showModulePlaceholder(section) {
    content.innerHTML = `
        <div class="section-heading">
            <h3>${sections[section]}</h3>
            <p>Este módulo será conectado próximamente con la API.</p>
        </div>
    `;
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function getApiError(data, fallback) {
    if (Array.isArray(data?.detail)) {
        return data.detail.map(item => item.msg).filter(Boolean).join("\n");
    }
    if (typeof data?.detail === "string") return data.detail;
    return fallback;
}

// =====================================
// MODULO CLIENTES
// =====================================

async function showCustomers() {
    content.innerHTML = `
        <div class="section-heading">
            <h3>Gestión de clientes</h3>
            <p>Consulta y administra los clientes registrados.</p>
        </div>

        <div class="module-toolbar">
            <input
                type="search"
                id="customer-search"
                class="module-search"
                placeholder="Buscar por nombre o documento..."
            >
            <button class="primary-button" id="new-customer">
                + Nuevo cliente
            </button>
        </div>

        <p id="customer-message" class="module-message">Cargando clientes...</p>

        <div class="table-container">
            <table class="customer-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nombre completo</th>
                        <th>Documento</th>
                        <th>Teléfono</th>
                        <th>Correo</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody id="customer-table-body"></tbody>
            </table>
        </div>

        <div id="customer-modal" class="customer-modal hidden">
            <form id="customer-form" class="customer-form">
                <h3 id="customer-form-title">Nuevo cliente</h3>
                <input type="hidden" id="customer-id">

                <label for="customer-name">Nombre completo *</label>
                <input id="customer-name" type="text" minlength="3"
                    maxlength="120" required>

                <label for="customer-document">Número de documento *</label>
                <input id="customer-document" type="text"
                    minlength="5" maxlength="20" required>

                <label for="customer-phone">Teléfono</label>
                <input id="customer-phone" type="text" maxlength="20">

                <label for="customer-email">Correo electrónico</label>
                <input id="customer-email" type="email" maxlength="120">

                <div class="form-actions">
                    <button type="button" class="secondary-button"
                        id="cancel-customer">Cancelar</button>
                    <button type="submit" class="primary-button">
                        Guardar cliente
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById("new-customer")
        .addEventListener("click", openCustomerForm);
    document.getElementById("cancel-customer")
        .addEventListener("click", closeCustomerForm);
    document.getElementById("customer-form")
        .addEventListener("submit", saveCustomer);
    document.getElementById("customer-search")
        .addEventListener("input", filterCustomers);
    document.getElementById("customer-table-body")
        .addEventListener("click", handleCustomerAction);

    await loadCustomers();
}

async function loadCustomers() {
    const message = document.getElementById("customer-message");
    if (!message) return;

    message.textContent = "Cargando clientes...";

    try {
        const response = await fetch(`${API_URL}/customers/`);
        if (!response.ok) throw new Error("No fue posible consultar los clientes.");

        customers = await response.json();
        renderCustomers(customers);

        message.textContent = customers.length
            ? `${customers.length} cliente(s) encontrado(s).`
            : "Todavía no hay clientes registrados.";
        message.className = "module-message";
    } catch (error) {
        message.textContent = error.message;
        message.className = "module-message error";
    }
}

function renderCustomers(data) {
    const tbody = document.getElementById("customer-table-body");
    if (!tbody) return;

    tbody.innerHTML = data.map(customer => `
        <tr>
            <td>${customer.id}</td>
            <td>${escapeHTML(customer.full_name)}</td>
            <td>${escapeHTML(customer.document_number)}</td>
            <td>${escapeHTML(customer.phone || "—")}</td>
            <td>${escapeHTML(customer.email || "—")}</td>
            <td>
                <button class="action-button"
                    data-action="view" data-id="${customer.id}">Ver</button>
                <button class="action-button"
                    data-action="edit" data-id="${customer.id}">Editar</button>
                <button class="action-button delete"
                    data-action="delete" data-id="${customer.id}">Eliminar</button>
            </td>
        </tr>
    `).join("");
}

function filterCustomers(event) {
    const search = event.target.value.toLowerCase();

    const filtered = customers.filter(customer =>
        (customer.full_name || "").toLowerCase().includes(search) ||
        (customer.document_number || "").toLowerCase().includes(search)
    );

    renderCustomers(filtered);
}

function openCustomerForm(customer = null) {
    document.getElementById("customer-form").reset();

    document.getElementById("customer-id").value = customer?.id || "";
    document.getElementById("customer-form-title").textContent =
        customer ? "Editar cliente" : "Nuevo cliente";

    document.getElementById("customer-name").value =
        customer?.full_name || "";

    document.getElementById("customer-document").value =
        customer?.document_number || "";

    document.getElementById("customer-phone").value =
        customer?.phone || "";

    document.getElementById("customer-email").value =
        customer?.email || "";

    document.getElementById("customer-modal").classList.remove("hidden");
}

function closeCustomerForm() {
    document.getElementById("customer-modal").classList.add("hidden");
}

async function saveCustomer(event) {
    event.preventDefault();

    const id = document.getElementById("customer-id").value;

    const customerData = {
        full_name: document.getElementById("customer-name").value.trim(),
        document_number: document.getElementById("customer-document").value.trim(),
        phone: document.getElementById("customer-phone").value.trim() || null,
        email: document.getElementById("customer-email").value.trim() || null
    };

    const url = id
        ? `${API_URL}/customers/${id}`
        : `${API_URL}/customers/`;

    const method = id ? "PATCH" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(customerData)
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(
                getApiError(error, "No se pudo guardar el cliente.")
            );
        }

        closeCustomerForm();
        await loadCustomers();

        const message = document.getElementById("customer-message");

        if (message) {
            message.textContent = id
                ? "Cliente actualizado correctamente."
                : "Cliente registrado correctamente.";

            message.className = "module-message success";
        }

    } catch (error) {
        alert(error.message);
    }
}

async function handleCustomerAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "view") {
        await viewCustomer(id);
    }

    if (action === "edit") {
        const customer = customers.find(item => item.id === id);
        if (customer) openCustomerForm(customer);
    }

    if (action === "delete") {
        await deleteCustomer(id);
    }
}

async function viewCustomer(id) {
    try {
        const response = await fetch(`${API_URL}/customers/${id}`);

        if (!response.ok) {
            throw new Error("No se encontró el cliente.");
        }

        const customer = await response.json();

        alert(
            `CLIENTE #${customer.id}\n\n` +
            `Nombre: ${customer.full_name}\n` +
            `Documento: ${customer.document_number}\n` +
            `Teléfono: ${customer.phone || "No registrado"}\n` +
            `Correo: ${customer.email || "No registrado"}`
        );

    } catch (error) {
        alert(error.message);
    }
}

async function deleteCustomer(id) {
    const confirmed = confirm(
        `¿Estás seguro de eliminar el cliente #${id}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/customers/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);
            throw new Error(
                getApiError(error, "No se pudo eliminar el cliente.")
            );
        }

        await loadCustomers();

        const message = document.getElementById("customer-message");

        if (message) {
            message.textContent = "Cliente eliminado correctamente.";
            message.className = "module-message success";
        }

    } catch (error) {
        alert(error.message);
    }
}

// =====================================
// MODULO VEHICULOS
// =====================================

async function showVehicles() {
    content.innerHTML = `
        <div class="section-heading">
            <h3>Gestión de vehículos</h3>
            <p>Consulta y administra los vehículos registrados en ZonaPark.</p>
        </div>

        <div class="module-toolbar">
            <input
                type="search"
                id="vehicle-search"
                class="module-search"
                placeholder="Buscar por placa, tipo o marca..."
            >

            <button class="primary-button" id="new-vehicle">
                + Nuevo vehículo
            </button>
        </div>

        <p id="vehicle-message" class="module-message">
            Cargando vehículos...
        </p>

        <div class="table-container">
            <table class="customer-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Placa</th>
                        <th>Tipo</th>
                        <th>Marca</th>
                        <th>Color</th>
                        <th>Propietario</th>
                        <th>Acciones</th>
                    </tr>
                </thead>

                <tbody id="vehicle-table-body"></tbody>
            </table>
        </div>

        <div id="vehicle-modal" class="customer-modal hidden">
            <form id="vehicle-form" class="customer-form">
                <h3 id="vehicle-form-title">Nuevo vehículo</h3>

                <input type="hidden" id="vehicle-id">

                <label for="vehicle-plate">Placa *</label>
                <input
                    id="vehicle-plate"
                    type="text"
                    minlength="5"
                    maxlength="10"
                    required
                >

                <label for="vehicle-type">Tipo de vehículo *</label>
                <select id="vehicle-type" required>
                    <option value="">Selecciona un tipo</option>
                    <option value="carro">Carro</option>
                    <option value="moto">Moto</option>
                    <option value="bicicleta">Bicicleta</option>
                </select>

                <label for="vehicle-brand">Marca</label>
                <input id="vehicle-brand" type="text" maxlength="50">

                <label for="vehicle-color">Color</label>
                <input id="vehicle-color" type="text" maxlength="30">

                <label for="vehicle-customer">Propietario (opcional)</label>
                <select id="vehicle-customer">
                    <option value="">Sin propietario registrado</option>
                </select>

                <div class="form-actions">
                    <button
                        type="button"
                        class="secondary-button"
                        id="cancel-vehicle"
                    >
                        Cancelar
                    </button>

                    <button type="submit" class="primary-button">
                        Guardar vehículo
                    </button>
                </div>
            </form>
        </div>
    `;

    document.getElementById("new-vehicle")
        .addEventListener("click", () => openVehicleForm());

    document.getElementById("cancel-vehicle")
        .addEventListener("click", closeVehicleForm);

    document.getElementById("vehicle-form")
        .addEventListener("submit", saveVehicle);

    document.getElementById("vehicle-search")
        .addEventListener("input", filterVehicles);

    document.getElementById("vehicle-table-body")
        .addEventListener("click", handleVehicleAction);

    await loadVehicleCustomers();
    await loadVehicles();
}

async function loadVehicleCustomers() {
    const select = document.getElementById("vehicle-customer");
    if (!select) return;

    try {
        const response = await fetch(`${API_URL}/customers/`);

        if (!response.ok) {
            throw new Error("No se pudieron cargar los clientes.");
        }

        customers = await response.json();

        select.innerHTML = `
            <option value="">Sin propietario registrado</option>

            ${customers.map(customer => `
                <option value="${customer.id}">
                    ${escapeHTML(customer.full_name)} -
                    ${escapeHTML(customer.document_number)}
                </option>
            `).join("")}
        `;

    } catch (error) {
        select.innerHTML =
            '<option value="">Sin propietario registrado</option>';

        console.error(error);
    }
}

async function loadVehicles() {
    const message = document.getElementById("vehicle-message");
    if (!message) return;

    message.textContent = "Cargando vehículos...";

    try {
        const response = await fetch(`${API_URL}/vehicles/`);

        if (!response.ok) {
            const error = await response.json().catch(() => null);

            throw new Error(
                getApiError(error, "No fue posible consultar los vehículos.")
            );
        }

        vehicles = await response.json();

        renderVehicles(vehicles);

        message.textContent = vehicles.length
            ? `${vehicles.length} vehículo(s) encontrado(s).`
            : "Todavía no hay vehículos registrados.";

        message.className = "module-message";

    } catch (error) {
        message.textContent = error.message;
        message.className = "module-message error";
    }
}

function getCustomerName(customerId) {
    if (customerId === null || customerId === undefined) {
        return "Sin propietario";
    }

    const customer = customers.find(item => item.id === customerId);

    return customer
        ? customer.full_name
        : `Cliente #${customerId}`;
}
function renderVehicles(data) {
    const tbody = document.getElementById("vehicle-table-body");
    if (!tbody) return;

    if (!data.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7">No hay vehículos para mostrar.</td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(vehicle => `
        <tr>
            <td>${vehicle.id}</td>
            <td>${escapeHTML(vehicle.plate)}</td>
            <td>${escapeHTML(vehicle.vehicle_type)}</td>
            <td>${escapeHTML(vehicle.brand || "—")}</td>
            <td>${escapeHTML(vehicle.color || "—")}</td>
            <td>${escapeHTML(getCustomerName(vehicle.customer_id))}</td>
            <td>
                <button class="action-button"
                    data-action="view" data-id="${vehicle.id}">
                    Ver
                </button>

                <button class="action-button"
                    data-action="edit" data-id="${vehicle.id}">
                    Editar
                </button>

                <button class="action-button"
                    data-action="delete" data-id="${vehicle.id}">
                    Eliminar
                </button>
            </td>
        </tr>
    `).join("");
}

function filterVehicles(event) {
    const search = event.target.value.toLowerCase();

    const filtered = vehicles.filter(vehicle =>
        (vehicle.plate || "").toLowerCase().includes(search) ||
        (vehicle.vehicle_type || "").toLowerCase().includes(search) ||
        (vehicle.brand || "").toLowerCase().includes(search)
    );

    renderVehicles(filtered);
}

function openVehicleForm(vehicle = null) {
    document.getElementById("vehicle-form").reset();

    document.getElementById("vehicle-id").value =
        vehicle?.id || "";

    document.getElementById("vehicle-form-title").textContent =
        vehicle ? "Editar vehículo" : "Nuevo vehículo";

    document.getElementById("vehicle-plate").value =
        vehicle?.plate || "";

    document.getElementById("vehicle-type").value =
        vehicle?.vehicle_type || "";

    document.getElementById("vehicle-brand").value =
        vehicle?.brand || "";

    document.getElementById("vehicle-color").value =
        vehicle?.color || "";

    document.getElementById("vehicle-customer").value =
        vehicle?.customer_id ?? "";

    document.getElementById("vehicle-modal")
        .classList.remove("hidden");
}

function closeVehicleForm() {
    document.getElementById("vehicle-modal")
        .classList.add("hidden");
}

async function saveVehicle(event) {
    event.preventDefault();

    const id = document.getElementById("vehicle-id").value;
    const customerId =
        document.getElementById("vehicle-customer").value;

    const vehicleData = {
        plate: document.getElementById("vehicle-plate")
            .value.trim().toUpperCase(),

        vehicle_type: document.getElementById("vehicle-type").value,

        brand: document.getElementById("vehicle-brand")
            .value.trim() || null,

        color: document.getElementById("vehicle-color")
            .value.trim() || null,

        customer_id: customerId ? Number(customerId) : null
    };

    const url = id
        ? `${API_URL}/vehicles/${id}`
        : `${API_URL}/vehicles/`;

    const method = id ? "PATCH" : "POST";

    try {
        const response = await fetch(url, {
            method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(vehicleData)
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);

            throw new Error(
                getApiError(error, "No se pudo guardar el vehículo.")
            );
        }

        closeVehicleForm();
        await loadVehicles();

        const message = document.getElementById("vehicle-message");

        message.textContent = id
            ? "Vehículo actualizado correctamente."
            : "Vehículo registrado correctamente.";

        message.className = "module-message success";

    } catch (error) {
        alert(error.message);
    }
}

async function handleVehicleAction(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const id = Number(button.dataset.id);
    const action = button.dataset.action;

    if (action === "view") {
        await viewVehicle(id);
    }

    if (action === "edit") {
        const vehicle = vehicles.find(item => item.id === id);

        if (vehicle) {
            openVehicleForm(vehicle);
        }
    }

    if (action === "delete") {
        await deleteVehicle(id);
    }
}

async function viewVehicle(id) {
    try {
        const response = await fetch(`${API_URL}/vehicles/${id}`);

        if (!response.ok) {
            throw new Error("No se encontró el vehículo.");
        }

        const vehicle = await response.json();

        alert(
            `VEHÍCULO #${vehicle.id}\n\n` +
            `Placa: ${vehicle.plate}\n` +
            `Tipo: ${vehicle.vehicle_type}\n` +
            `Marca: ${vehicle.brand || "No registrada"}\n` +
            `Color: ${vehicle.color || "No registrado"}\n` +
            `Propietario: ${getCustomerName(vehicle.customer_id)}`
        );

    } catch (error) {
        alert(error.message);
    }
}

async function deleteVehicle(id) {
    const confirmed = confirm(
        `¿Estás seguro de eliminar el vehículo #${id}?`
    );

    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/vehicles/${id}`, {
            method: "DELETE"
        });

        if (!response.ok) {
            const error = await response.json().catch(() => null);

            throw new Error(
                getApiError(error, "No se pudo eliminar el vehículo.")
            );
        }

        await loadVehicles();

        const message = document.getElementById("vehicle-message");

        message.textContent = "Vehículo eliminado correctamente.";
        message.className = "module-message success";

    } catch (error) {
        alert(error.message);
    }
}


// =====================================
// MODULO ESPACIOS DE PARQUEADERO
// =====================================
async function showParkingSpaces() {
    content.innerHTML = `
        <div class="section-heading"><h3>Gestión de espacios</h3><p>Administra las celdas, el tipo de vehículo y su disponibilidad.</p></div>
        <div class="module-toolbar">
            <input id="space-search" type="search" class="module-search" placeholder="Buscar por código, tipo o piso...">
            <button id="new-space" class="primary-button">+ Nuevo espacio</button>
        </div>
        <p id="space-message" class="module-message">Cargando espacios...</p>
        <div class="table-container"><table class="customer-table">
            <thead><tr><th>ID</th><th>Código</th><th>Tipo</th><th>Piso</th><th>Disponibilidad</th><th>Acciones</th></tr></thead>
            <tbody id="space-table-body"></tbody>
        </table></div>
        <div id="space-modal" class="customer-modal hidden"><form id="space-form" class="customer-form">
            <h3 id="space-form-title">Nuevo espacio</h3><input id="space-id" type="hidden">
            <label for="space-code">Código *</label><input id="space-code" minlength="2" maxlength="10" required placeholder="Ej. A-01">
            <label for="space-type">Tipo de vehículo *</label>
            <select id="space-type" required><option value="">Selecciona un tipo</option><option value="carro">Carro</option><option value="moto">Moto</option><option value="bicicleta">Bicicleta</option></select>
            <label for="space-floor">Piso</label><input id="space-floor" type="number" min="0" max="20" value="1">
            <label for="space-available">Disponibilidad</label><select id="space-available"><option value="true">Disponible</option><option value="false">Ocupado</option></select>
            <div class="form-actions"><button type="button" id="cancel-space" class="secondary-button">Cancelar</button><button type="submit" class="primary-button">Guardar espacio</button></div>
        </form></div>`;
    document.getElementById("new-space").onclick = () => openSpaceForm();
    document.getElementById("cancel-space").onclick = closeSpaceForm;
    document.getElementById("space-form").addEventListener("submit", saveSpace);
    document.getElementById("space-search").addEventListener("input", filterSpaces);
    document.getElementById("space-table-body").addEventListener("click", handleSpaceAction);
    await loadParkingSpaces();
}
async function loadParkingSpaces() {
    const msg = document.getElementById("space-message"); if (!msg) return;
    try {
        const res = await fetch(`${API_URL}/parking-spaces/`);
        if (!res.ok) throw new Error(getApiError(await res.json().catch(() => null), "No se pudieron cargar los espacios."));
        parkingSpaces = await res.json(); renderParkingSpaces(parkingSpaces);
        msg.textContent = parkingSpaces.length ? `${parkingSpaces.length} espacio(s) encontrado(s).` : "Todavía no hay espacios registrados.";
        msg.className = "module-message";
    } catch (e) { msg.textContent = e.message; msg.className = "module-message error"; }
}
function renderParkingSpaces(data) {
    const tbody = document.getElementById("space-table-body"); if (!tbody) return;
    tbody.innerHTML = data.length ? data.map(s => `<tr><td>${s.id}</td><td>${escapeHTML(s.code)}</td><td>${escapeHTML(s.vehicle_type)}</td><td>${s.floor}</td><td>${s.is_available ? "Disponible" : "Ocupado"}</td><td><button class="action-button" data-action="view" data-id="${s.id}">Ver</button> <button class="action-button" data-action="edit" data-id="${s.id}">Editar</button> <button class="action-button" data-action="delete" data-id="${s.id}">Eliminar</button></td></tr>`).join("") : '<tr><td colspan="6">No hay espacios para mostrar.</td></tr>';
}
function filterSpaces(e) { const q=e.target.value.toLowerCase(); renderParkingSpaces(parkingSpaces.filter(s=>s.code.toLowerCase().includes(q)||s.vehicle_type.toLowerCase().includes(q)||String(s.floor).includes(q))); }
function openSpaceForm(s=null) {
    document.getElementById("space-form").reset(); document.getElementById("space-id").value=s?.id||"";
    document.getElementById("space-form-title").textContent=s?"Editar espacio":"Nuevo espacio";
    document.getElementById("space-code").value=s?.code||""; document.getElementById("space-type").value=s?.vehicle_type||"";
    document.getElementById("space-floor").value=s?.floor??1; document.getElementById("space-available").value=String(s?.is_available??true);
    document.getElementById("space-modal").classList.remove("hidden");
}
function closeSpaceForm(){document.getElementById("space-modal").classList.add("hidden");}
async function saveSpace(e) {
    e.preventDefault(); const id=document.getElementById("space-id").value;
    const data={code:document.getElementById("space-code").value.trim().toUpperCase(),vehicle_type:document.getElementById("space-type").value,floor:Number(document.getElementById("space-floor").value),is_available:document.getElementById("space-available").value==="true"};
    try {
        const res=await fetch(id?`${API_URL}/parking-spaces/${id}`:`${API_URL}/parking-spaces/`,{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        if(!res.ok) throw new Error(getApiError(await res.json().catch(()=>null),"No se pudo guardar el espacio."));
        closeSpaceForm(); await loadParkingSpaces(); const m=document.getElementById("space-message"); m.textContent=id?"Espacio actualizado correctamente.":"Espacio registrado correctamente."; m.className="module-message success";
    } catch(err){alert(err.message);}
}
async function handleSpaceAction(e) {
    const b=e.target.closest("[data-action]"); if(!b)return; const id=Number(b.dataset.id), action=b.dataset.action;
    if(action==="view"){try{const r=await fetch(`${API_URL}/parking-spaces/${id}`);if(!r.ok)throw new Error("No se encontró el espacio.");const s=await r.json();alert(`ESPACIO #${s.id}\nCódigo: ${s.code}\nTipo: ${s.vehicle_type}\nPiso: ${s.floor}\nEstado: ${s.is_available?"Disponible":"Ocupado"}`);}catch(err){alert(err.message);}}
    if(action==="edit"){const s=parkingSpaces.find(x=>x.id===id);if(s)openSpaceForm(s);}
    if(action==="delete"&&confirm(`¿Eliminar el espacio #${id}?`)){try{const r=await fetch(`${API_URL}/parking-spaces/${id}`,{method:"DELETE"});if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo eliminar. Puede estar asociado a una sesión."));await loadParkingSpaces();}catch(err){alert(err.message);}}
}

// =====================================
// MODULO TARIFAS
// =====================================
async function showRates() {
    content.innerHTML = `
        <div class="section-heading"><h3>Gestión de tarifas</h3><p>Configura los precios por hora y por día.</p></div>
        <div class="module-toolbar"><input id="rate-search" type="search" class="module-search" placeholder="Buscar tarifa..."><button id="new-rate" class="primary-button">+ Nueva tarifa</button></div>
        <p id="rate-message" class="module-message">Cargando tarifas...</p>
        <div class="table-container"><table class="customer-table"><thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Precio/hora</th><th>Precio/día</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="rate-table-body"></tbody></table></div>
        <div id="rate-modal" class="customer-modal hidden"><form id="rate-form" class="customer-form">
            <h3 id="rate-form-title">Nueva tarifa</h3><input id="rate-id" type="hidden">
            <label for="rate-name">Nombre *</label><input id="rate-name" minlength="3" maxlength="60" required placeholder="Ej. Carro por hora">
            <label for="rate-type">Tipo de vehículo *</label><select id="rate-type" required><option value="">Selecciona un tipo</option><option value="carro">Carro</option><option value="moto">Moto</option><option value="bicicleta">Bicicleta</option></select>
            <label for="rate-hour">Precio por hora (COP) *</label><input id="rate-hour" type="number" min="0" step="1" required>
            <label for="rate-day">Precio por día (COP, opcional)</label><input id="rate-day" type="number" min="0" step="1">
            <label for="rate-active">Estado</label><select id="rate-active"><option value="true">Activa</option><option value="false">Inactiva</option></select>
            <div class="form-actions"><button type="button" id="cancel-rate" class="secondary-button">Cancelar</button><button type="submit" class="primary-button">Guardar tarifa</button></div>
        </form></div>`;
    document.getElementById("new-rate").onclick=()=>openRateForm(); document.getElementById("cancel-rate").onclick=closeRateForm;
    document.getElementById("rate-form").addEventListener("submit",saveRate); document.getElementById("rate-search").addEventListener("input",filterRates);
    document.getElementById("rate-table-body").addEventListener("click",handleRateAction); await loadRates();
}
async function loadRates() {
    const m=document.getElementById("rate-message");if(!m)return;
    try{const r=await fetch(`${API_URL}/rates/`);if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudieron cargar las tarifas."));
        rates=await r.json();renderRates(rates);m.textContent=rates.length?`${rates.length} tarifa(s) encontrada(s).`:"Todavía no hay tarifas registradas.";m.className="module-message";
    }catch(e){m.textContent=e.message;m.className="module-message error";}
}
function formatCOP(v){return v===null||v===undefined||v===""?"—":new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(v);}
function renderRates(data){
    const t=document.getElementById("rate-table-body");if(!t)return;
    t.innerHTML=data.length?data.map(r=>`<tr><td>${r.id}</td><td>${escapeHTML(r.name)}</td><td>${escapeHTML(r.vehicle_type)}</td><td>${formatCOP(r.price_per_hour)}</td><td>${formatCOP(r.price_per_day)}</td><td>${r.is_active?"Activa":"Inactiva"}</td><td><button class="action-button" data-action="view" data-id="${r.id}">Ver</button> <button class="action-button" data-action="edit" data-id="${r.id}">Editar</button> <button class="action-button" data-action="delete" data-id="${r.id}">Eliminar</button></td></tr>`).join(""):'<tr><td colspan="7">No hay tarifas para mostrar.</td></tr>';
}
function filterRates(e){const q=e.target.value.toLowerCase();renderRates(rates.filter(r=>r.name.toLowerCase().includes(q)||r.vehicle_type.toLowerCase().includes(q)));}
function openRateForm(r=null){
    document.getElementById("rate-form").reset();document.getElementById("rate-id").value=r?.id||"";document.getElementById("rate-form-title").textContent=r?"Editar tarifa":"Nueva tarifa";
    document.getElementById("rate-name").value=r?.name||"";document.getElementById("rate-type").value=r?.vehicle_type||"";document.getElementById("rate-hour").value=r?.price_per_hour??"";
    document.getElementById("rate-day").value=r?.price_per_day??"";document.getElementById("rate-active").value=String(r?.is_active??true);document.getElementById("rate-modal").classList.remove("hidden");
}
function closeRateForm(){document.getElementById("rate-modal").classList.add("hidden");}
async function saveRate(e){
    e.preventDefault();const id=document.getElementById("rate-id").value,day=document.getElementById("rate-day").value;
    const data={name:document.getElementById("rate-name").value.trim(),vehicle_type:document.getElementById("rate-type").value,price_per_hour:Number(document.getElementById("rate-hour").value),price_per_day:day===""?null:Number(day),is_active:document.getElementById("rate-active").value==="true"};
    try{const r=await fetch(id?`${API_URL}/rates/${id}`:`${API_URL}/rates/`,{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});
        if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo guardar la tarifa."));closeRateForm();await loadRates();const m=document.getElementById("rate-message");m.textContent=id?"Tarifa actualizada correctamente.":"Tarifa registrada correctamente.";m.className="module-message success";
    }catch(err){alert(err.message);}
}
async function handleRateAction(e){
    const b=e.target.closest("[data-action]");if(!b)return;const id=Number(b.dataset.id),a=b.dataset.action;
    if(a==="view"){try{const r=await fetch(`${API_URL}/rates/${id}`);if(!r.ok)throw new Error("No se encontró la tarifa.");const x=await r.json();alert(`TARIFA #${x.id}\n${x.name}\nTipo: ${x.vehicle_type}\nHora: ${formatCOP(x.price_per_hour)}\nDía: ${formatCOP(x.price_per_day)}\nEstado: ${x.is_active?"Activa":"Inactiva"}`);}catch(err){alert(err.message);}}
    if(a==="edit"){const x=rates.find(v=>v.id===id);if(x)openRateForm(x);}
    if(a==="delete"&&confirm(`¿Eliminar la tarifa #${id}?`)){try{const r=await fetch(`${API_URL}/rates/${id}`,{method:"DELETE"});if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo eliminar. Puede estar asociada a una sesión."));await loadRates();}catch(err){alert(err.message);}}
}

// =====================================
// MODULO SESIONES DE PARQUEO
// =====================================
async function showParkingSessions(){
    content.innerHTML=`
        <div class="section-heading"><h3>Gestión de sesiones</h3><p>Registra entradas y procesa las salidas de vehículos.</p></div>
        <div class="module-toolbar"><input id="session-search" type="search" class="module-search" placeholder="Buscar por placa, espacio o estado..."><button id="new-session" class="primary-button">+ Registrar entrada</button></div>
        <p id="session-message" class="module-message">Cargando sesiones...</p>
        <div class="table-container"><table class="customer-table"><thead><tr><th>ID</th><th>Vehículo</th><th>Espacio</th><th>Tarifa</th><th>Entrada</th><th>Salida</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="session-table-body"></tbody></table></div>
        <div id="session-modal" class="customer-modal hidden"><form id="session-form" class="customer-form">
            <h3 id="session-form-title">Registrar entrada</h3><input id="session-id" type="hidden">
            <label for="session-vehicle">Vehículo *</label><select id="session-vehicle" required></select>
            <label for="session-space">Espacio disponible *</label><select id="session-space" required></select>
            <label for="session-rate">Tarifa activa *</label><select id="session-rate" required></select>
            <p class="module-message">La hora de entrada se registra automáticamente.</p>
            <div class="form-actions"><button type="button" id="cancel-session" class="secondary-button">Cancelar</button><button type="submit" class="primary-button">Guardar</button></div>
        </form></div>`;
    document.getElementById("new-session").onclick=()=>openSessionForm();document.getElementById("cancel-session").onclick=closeSessionForm;
    document.getElementById("session-form").addEventListener("submit",saveSession);document.getElementById("session-search").addEventListener("input",filterSessions);
    document.getElementById("session-table-body").addEventListener("click",handleSessionAction);
    await loadSessionDependencies();await loadParkingSessions();
}
async function loadSessionDependencies(){
    try{
        const [vr,sr,rr]=await Promise.all([fetch(`${API_URL}/vehicles/`),fetch(`${API_URL}/parking-spaces/`),fetch(`${API_URL}/rates/`)]);
        if(!vr.ok||!sr.ok||!rr.ok)throw new Error("No se pudieron cargar vehículos, espacios y tarifas.");
        vehicles=await vr.json();parkingSpaces=await sr.json();rates=await rr.json();
    }catch(e){const m=document.getElementById("session-message");if(m){m.textContent=e.message;m.className="module-message error";}}
}
async function loadParkingSessions(){
    const m=document.getElementById("session-message");if(!m)return;
    try{const r=await fetch(`${API_URL}/parking-sessions/`);if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudieron cargar las sesiones."));
        parkingSessions=await r.json();renderParkingSessions(parkingSessions);m.textContent=parkingSessions.length?`${parkingSessions.length} sesión(es) encontrada(s).`:"Todavía no hay sesiones registradas.";m.className="module-message";
    }catch(e){m.textContent=e.message;m.className="module-message error";}
}
function vehicleLabel(id){const v=vehicles.find(x=>x.id===id);return v?`${v.plate} (${v.vehicle_type})`:`Vehículo #${id}`;}
function spaceLabel(id){const s=parkingSpaces.find(x=>x.id===id);return s?`${s.code} (${s.vehicle_type})`:`Espacio #${id}`;}
function rateLabel(id){const r=rates.find(x=>x.id===id);return r?r.name:`Tarifa #${id}`;}
function dateLabel(value){if(!value)return "—";const d=new Date(value);return Number.isNaN(d.getTime())?"—":d.toLocaleString("es-CO");}
function renderParkingSessions(data){
    const t=document.getElementById("session-table-body");if(!t)return;
    t.innerHTML=data.length?data.map(s=>`<tr><td>${s.id}</td><td>${escapeHTML(vehicleLabel(s.vehicle_id))}</td><td>${escapeHTML(spaceLabel(s.space_id))}</td><td>${escapeHTML(rateLabel(s.rate_id))}</td><td>${dateLabel(s.entry_time)}</td><td>${dateLabel(s.exit_time)}</td><td>${formatCOP(s.total_amount)}</td><td>${s.is_active?"Activa":"Cerrada"}</td><td><button class="action-button" data-action="view" data-id="${s.id}">Ver</button> ${s.is_active?`<button class="action-button" data-action="close" data-id="${s.id}">Cerrar</button> <button class="action-button" data-action="edit" data-id="${s.id}">Editar</button>`:""} <button class="action-button" data-action="delete" data-id="${s.id}">Eliminar</button></td></tr>`).join(""):'<tr><td colspan="9">No hay sesiones para mostrar.</td></tr>';
}
function filterSessions(e){const q=e.target.value.toLowerCase();renderParkingSessions(parkingSessions.filter(s=>vehicleLabel(s.vehicle_id).toLowerCase().includes(q)||spaceLabel(s.space_id).toLowerCase().includes(q)||rateLabel(s.rate_id).toLowerCase().includes(q)||(s.is_active?"activa":"cerrada").includes(q)||String(s.id).includes(q)));}
function fillSessionSelects(selected={}){
    const vs=document.getElementById("session-vehicle"),ss=document.getElementById("session-space"),rs=document.getElementById("session-rate");
    vs.innerHTML='<option value="">Selecciona un vehículo</option>'+vehicles.map(v=>`<option value="${v.id}" ${selected.vehicle_id===v.id?"selected":""}>${escapeHTML(v.plate)} - ${escapeHTML(v.vehicle_type)}</option>`).join("");
    ss.innerHTML='<option value="">Selecciona un espacio</option>'+parkingSpaces.filter(s=>s.is_available||s.id===selected.space_id).map(s=>`<option value="${s.id}" ${selected.space_id===s.id?"selected":""}>${escapeHTML(s.code)} - ${escapeHTML(s.vehicle_type)} (Piso ${s.floor})</option>`).join("");
    rs.innerHTML='<option value="">Selecciona una tarifa</option>'+rates.filter(r=>r.is_active||r.id===selected.rate_id).map(r=>`<option value="${r.id}" ${selected.rate_id===r.id?"selected":""}>${escapeHTML(r.name)} - ${escapeHTML(r.vehicle_type)} (${formatCOP(r.price_per_hour)}/h)</option>`).join("");
}
function openSessionForm(s=null){
    document.getElementById("session-form").reset();document.getElementById("session-id").value=s?.id||"";
    document.getElementById("session-form-title").textContent=s?"Editar sesión activa":"Registrar entrada";fillSessionSelects(s||{});
    document.getElementById("session-vehicle").disabled=!!s;document.getElementById("session-modal").classList.remove("hidden");
}
function closeSessionForm(){document.getElementById("session-modal").classList.add("hidden");document.getElementById("session-vehicle").disabled=false;}
async function saveSession(e){
    e.preventDefault();const id=document.getElementById("session-id").value,vehicleId=Number(document.getElementById("session-vehicle").value),spaceId=Number(document.getElementById("session-space").value),rateId=Number(document.getElementById("session-rate").value);
    const v=vehicles.find(x=>x.id===vehicleId),sp=parkingSpaces.find(x=>x.id===spaceId),rt=rates.find(x=>x.id===rateId);
    if(!sp||!rt||( !id&&!v)){alert("Selecciona los datos requeridos.");return;}
    if(v&&(v.vehicle_type!==sp.vehicle_type||v.vehicle_type!==rt.vehicle_type)){alert("El tipo de vehículo debe coincidir con el espacio y la tarifa.");return;}
    if(!id&&!sp.is_available){alert("El espacio ya no está disponible. Actualiza e inténtalo de nuevo.");return;}
    const old=parkingSessions.find(x=>x.id===Number(id));
    if(id&&old&&old.space_id!==spaceId&&!sp.is_available){alert("El nuevo espacio no está disponible.");return;}
    const payload=id?{space_id:spaceId,rate_id:rateId}:{vehicle_id:vehicleId,space_id:spaceId,rate_id:rateId};
    try{
        const r=await fetch(id?`${API_URL}/parking-sessions/${id}`:`${API_URL}/parking-sessions/`,{method:id?"PATCH":"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
        if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo guardar la sesión."));
        const saved=await r.json();
        // La API no modifica por sí sola is_available: se sincroniza desde el frontend.
        if(!id||old?.space_id!==spaceId){
            if(old?.space_id)await fetch(`${API_URL}/parking-spaces/${old.space_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_available:true})});
            const sr=await fetch(`${API_URL}/parking-spaces/${spaceId}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_available:false})});
            if(!sr.ok)alert("La sesión se guardó, pero no se pudo actualizar la disponibilidad del espacio.");
        }
        closeSessionForm();await loadSessionDependencies();await loadParkingSessions();const m=document.getElementById("session-message");m.textContent=id?"Sesión actualizada correctamente.":`Entrada registrada. Sesión #${saved.id}.`;m.className="module-message success";
    }catch(err){alert(err.message);}
}
async function handleSessionAction(e){
    const b=e.target.closest("[data-action]");if(!b)return;const id=Number(b.dataset.id),a=b.dataset.action;
    if(a==="view"){try{const r=await fetch(`${API_URL}/parking-sessions/${id}`);if(!r.ok)throw new Error("No se encontró la sesión.");const s=await r.json();alert(`SESIÓN #${s.id}\nVehículo: ${vehicleLabel(s.vehicle_id)}\nEspacio: ${spaceLabel(s.space_id)}\nTarifa: ${rateLabel(s.rate_id)}\nEntrada: ${dateLabel(s.entry_time)}\nSalida: ${dateLabel(s.exit_time)}\nTotal: ${formatCOP(s.total_amount)}\nEstado: ${s.is_active?"Activa":"Cerrada"}`);}catch(err){alert(err.message);}}
    if(a==="edit"){const s=parkingSessions.find(x=>x.id===id);if(s?.is_active)openSessionForm(s);}
    if(a==="close")await closeSession(id);
    if(a==="delete")await deleteSession(id);
}
async function closeSession(id){
    if(!confirm(`¿Registrar la salida y cerrar la sesión #${id}?`))return;const s=parkingSessions.find(x=>x.id===id);
    try{
        const r=await fetch(`${API_URL}/parking-sessions/${id}/close`,{method:"POST"});if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo cerrar la sesión."));
        const closed=await r.json();
        // El endpoint calcula el total, pero no libera la celda; se actualiza aquí.
        if(s){const sr=await fetch(`${API_URL}/parking-spaces/${s.space_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_available:true})});if(!sr.ok)alert("La sesión se cerró, pero no se pudo liberar el espacio. Actualízalo manualmente.");}
        await loadSessionDependencies();await loadParkingSessions();const m=document.getElementById("session-message");m.textContent=`Sesión cerrada. Total a pagar: ${formatCOP(closed.total_amount)}.`;m.className="module-message success";
    }catch(err){alert(err.message);}
}
async function deleteSession(id){
    if(!confirm(`¿Eliminar la sesión #${id}?`))return;const s=parkingSessions.find(x=>x.id===id);
    try{const r=await fetch(`${API_URL}/parking-sessions/${id}`,{method:"DELETE"});if(!r.ok)throw new Error(getApiError(await r.json().catch(()=>null),"No se pudo eliminar la sesión."));
        if(s?.is_active)await fetch(`${API_URL}/parking-spaces/${s.space_id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({is_available:true})});
        await loadSessionDependencies();await loadParkingSessions();const m=document.getElementById("session-message");m.textContent="Sesión eliminada correctamente.";m.className="module-message success";
    }catch(err){alert(err.message);}
}

// Los accesos del dashboard se generan dinámicamente.
content.addEventListener("click",e=>{const b=e.target.closest("[data-section]");if(b)navigateTo(b.dataset.section);});


// =====================================
// NAVEGACION ENTRE MODULOS
// =====================================

document.querySelectorAll("[data-section]").forEach(button => {
    button.addEventListener("click", () => {
        navigateTo(button.dataset.section);
    });
});

// =====================================
// VERIFICAR CONEXION CON LA API
// =====================================

checkApiConnection();