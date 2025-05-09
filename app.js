const API_BASE = "https://localhost:44344/api/app";
const todoModal = new bootstrap.Modal("#todoModal");
const deleteModal = new bootstrap.Modal("#deleteModal");
let currentTodoId = null;

document.addEventListener("DOMContentLoaded", () => {
  loadTodos();
  setupEventListeners();
});

async function loadTodos(status = null) {
  try {
    const statusFilter = document.getElementById("statusFilter").value;

    const response = await axios.get(`${API_BASE}/todo`, {
      params: {
        status: statusFilter || null,
      },
    });
    renderTodos(response.data.items);
  } catch (error) {
    console.log("Failed to load todos");
  }
}

function renderTodos(todos) {
  const tableBody = document.getElementById("todoTable");
  tableBody.innerHTML = "";

  if (todos.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="4" class="text-center">No todos found</td></tr>';
    return;
  }

  todos.forEach((todo) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${todo.title}</td>
            <td>${todo.description === null ? "" : todo.description}</td>
            <td>${getStatusBadge(todo.status)}</td>
           <td>${getPriorityBadge(todo.priority)}</td> 
           <td>${
             todo.dueDate === null
               ? ""
               : new Date(todo.dueDate).toLocaleString()
           }</td>
            <td>${new Date(todo.creationTime).toLocaleString()}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-primary edit-btn" data-id="${
                      todo.id
                    }">
                        <i class="fas fa-edit"></i>
                    </button>
                    ${
                      todo.status !== 2
                        ? `
                    <button class="btn btn-outline-success complete-btn" data-id="${todo.id}">
                        <i class="fas fa-check"></i>
                    </button>
                    `
                        : ""
                    }
                    <button class="btn btn-outline-danger delete-btn" data-id="${
                      todo.id
                    }">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

function getStatusBadge(status) {
  const statuses = ["Pending", "In Progress", "Completed"];

  const colors = ["bg-secondary", "bg-info", "bg-success"];

  return `<span class="badge d-inline-block  w-100 ${colors[status]}">${statuses[status]}</span>`;
}

function getPriorityBadge(priority) {
  const priorities = ["Low", "Medium", "High"];

  const colors = ["bg-success	", "bg-warning text-dark", "bg-danger"];

  return `<span class="badge d-inline-block  w-100 ${colors[priority]}">${priorities[priority]}</span>`;
}

function setupEventListeners() {
  document
    .getElementById("statusFilter")
    .addEventListener("change", () => loadTodos());

  document.getElementById("createBtn").addEventListener("click", () => {
    document.getElementById("modalTitle").textContent = "Create Todo";
    document.getElementById("todoId").value = "";
    document.getElementById("todoForm").reset();

    // Clear any previous validation errors
    ["title", "description", "dueDate"].forEach((id) => {
      document.getElementById(id).classList.remove("is-invalid");
    });

    todoModal.show();
  });

  // Save todo
  document.getElementById("saveBtn").addEventListener("click", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title");
    const desc = document.getElementById("description");
    const dueDate = document.getElementById("dueDate");

    let isValid = true;

    if (!title.value.trim() || title.value.length > 100) {
      title.classList.add("is-invalid");
      isValid = false;
    }

    if (desc.value.length > 500) {
      desc.classList.add("is-invalid");
      isValid = false;
    }

    if (dueDate.value && new Date(dueDate.value) <= new Date()) {
      dueDate.classList.add("is-invalid");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const todoData = {
      title: title.value.trim(),
      description: desc.value.trim(),
      priority: parseInt(document.getElementById("priority").value),
      status: parseInt(document.getElementById("status").value),
    };

    const dueDateInput = dueDate.value;

    if (dueDateInput) {
      todoData.dueDate = dueDateInput;
    }

    try {
      if (document.getElementById("todoId").value) {
        await axios.put(`${API_BASE}/todo/${currentTodoId}`, todoData);
      } else {
        await axios.post(`${API_BASE}/todo`, todoData);
      }
      todoModal.hide();
      loadTodos();
    } catch (error) {
      console.log("Failed to save todo");
    }
  });

  // Delete confirmation
  document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", async () => {
      try {
        await axios.delete(`${API_BASE}/todo/${currentTodoId}`);
        deleteModal.hide();
        loadTodos();
      } catch (error) {
        console.log("Failed to delete todo");
      }
    });

  document.addEventListener("click", (e) => {
    if (e.target.closest(".edit-btn")) {
      const id = e.target.closest(".edit-btn").dataset.id;
      openEditModal(id);
    }

    if (e.target.closest(".complete-btn")) {
      const id = e.target.closest(".complete-btn").dataset.id;
      markComplete(id);
    }

    if (e.target.closest(".delete-btn")) {
      currentTodoId = e.target.closest(".delete-btn").dataset.id;
      deleteModal.show();
    }
  });
}

// Open edit modal
async function openEditModal(id) {
  try {
    const response = await axios.get(`${API_BASE}/todo/${id}`);
    const todo = response.data;

    // Clear any previous validation errors
    ["title", "description", "dueDate"].forEach((id) => {
      document.getElementById(id).classList.remove("is-invalid");
    }); // Clear any previous validation errors
    ["title", "description", "dueDate"].forEach((id) => {
      document.getElementById(id).classList.remove("is-invalid");
    });

    document.getElementById("modalTitle").textContent = "Edit Todo";
    document.getElementById("todoId").value = id;
    document.getElementById("title").value = todo.title;
    document.getElementById("description").value = todo.description || "";
    document.getElementById("priority").value = todo.priority;
    document.getElementById("status").value = todo.status;
    document.getElementById("dueDate").value = todo.dueDate || "";
    currentTodoId = id;

    todoModal.show();
  } catch (error) {
    console.log("Failed to load todo");
  }
}

// Mark as complete
async function markComplete(id) {
  try {
    await axios.put(`${API_BASE}/todo/${id}/done`);
    loadTodos();
  } catch (error) {
    console.log("Failed to complete todo");
  }
}
