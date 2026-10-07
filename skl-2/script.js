  const API_URL = "https://dummyjson.com/recipes";

  // State
  let allRecipes = []; // sebuah array yg menyimpan data resep dr api
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
  let currentTab = "all";  // 'all' atau 'favorites' // Kegunaan variabel let currentTab = "all"; adalah sebagai penanda status (state) untuk mengetahui halaman/tab mana yang sedang aktif diakses oleh pengguna.

  // DOM Elements
  // 
  const recipeGrid = document.getElementById("recipe-grid");
  const searchForm = document.getElementById("search-form");
  const searchInput = document.getElementById("search-input");
  const cuisineFilter = document.getElementById("cuisine-filter");
  const difficultyFilter = document.getElementById("difficulty-filter");
  const recipeCount = document.getElementById("recipe-count");
  const favoriteCount = document.getElementById("favorite-count");
  const favoriteBtn = document.getElementById("favorite-button");
  const resetFilterBtn = document.getElementById("reset-filter-button");
  const sectionTitle = document.getElementById("section-title");

  // State Elements
  const loadingState = document.getElementById("loading-state");
  const errorState = document.getElementById("error-state");
  const emptyState = document.getElementById("empty-state");

  // Dialog / Modal
  const recipeDialog = document.getElementById("recipe-dialog");
  const closeDialog = document.getElementById("close-dialog");
  const dialogContent = document.getElementById("dialog-content");

  // Fetch Data dari API
  async function getRecipes() {
    if (loadingState) loadingState.hidden = false;
    if (errorState) errorState.hidden = true;
    if (recipeGrid) recipeGrid.hidden = true;

    try {
      const response = await fetch(API_URL);
      if (!response.ok) throw new Error("Gagal mengambil data");
      
      const data = await response.json();
      allRecipes = data.recipes;

      if (loadingState) loadingState.hidden = true;

      populateCuisineOptions(allRecipes);
      updateFavBadge();
      applyFilters();
    } catch (error) {
      console.error("Error:", error);
      if (loadingState) loadingState.hidden = true;
      if (errorState) errorState.hidden = false;
    }
  }

  // Mengisi Pilihan Filter Cuisine
  function populateCuisineOptions(recipes) {
    if (!cuisineFilter) return;
    const cuisines = [...new Set(recipes.map(r => r.cuisine))];
    cuisines.forEach(cuisine => {
      const option = document.createElement("option");
      option.value = cuisine;
      option.textContent = cuisine;
      cuisineFilter.appendChild(option);
    });
  }

  // Render Kartu Resep ke DOM
  function renderRecipes(recipes) {
    if (!recipeGrid) return;
    recipeGrid.innerHTML = "";

    if (recipes.length === 0) {
      if (emptyState) {
        emptyState.hidden = false;
        const emptyTitle = emptyState.querySelector("h3");
        const emptyText = emptyState.querySelector("p");
        
        if (currentTab === "favorites") {
          if (emptyTitle) emptyTitle.textContent = "Belum ada favorit";
          if (emptyText) emptyText.textContent = "Klik ikon hati pada resep untuk menyimpannya di sini.";
        } else {
          if (emptyTitle) emptyTitle.textContent = "Recipe not found";
          if (emptyText) emptyText.textContent = "Try another keyword or filter.";
        }
      }
      if (recipeGrid) recipeGrid.hidden = true;
      if (recipeCount) recipeCount.textContent = "0 recipes";
      return;
    } 

    if (emptyState) emptyState.hidden = true;
    if (recipeGrid) recipeGrid.hidden = false;

    if (recipeCount) {
      recipeCount.textContent = `${recipes.length} recipes`;
    }

    recipes.forEach(recipe => {
      const isFav = favorites.some(fav => fav.id === recipe.id);

      const card = document.createElement("div");
      card.classList.add("recipe-card");
      card.innerHTML = `
        <img src="${recipe.image}" alt="${recipe.name}" class="recipe-image">
        <div class="recipe-body">
          <span class="recipe-cuisine">${recipe.cuisine.toUpperCase()}</span>
          <h3 class="recipe-title">${recipe.name}</h3>
          <div class="recipe-meta">
            <span>⭐ ${recipe.rating}</span>
            <span>⏱️ ${recipe.prepTimeMinutes + recipe.cookTimeMinutes} min</span>
            <span>${recipe.difficulty}</span>
          </div>
          <div class="recipe-actions">
            <button class="detail-button" onclick="showDetail(${recipe.id})">View Detail</button>
            <button class="like-button" onclick="toggleFavorite(${recipe.id})" aria-label="Favorite">
              ${isFav ? "❤️" : "🤍"}
            </button>
          </div>
        </div>
      `;
      recipeGrid.appendChild(card);
    });
  }

  // Filter & Pencarian Resep
  function applyFilters() {
    const keyword = searchInput ? searchInput.value.toLowerCase().trim() : "";
    const selectedCuisine = cuisineFilter ? cuisineFilter.value : "";
    const selectedDifficulty = difficultyFilter ? difficultyFilter.value : "";

    if (resetFilterBtn) {
      resetFilterBtn.hidden = !(keyword || selectedCuisine || selectedDifficulty);
    }

    // Sumber data berdasarkan Tab Aktif
    const sourceRecipes = currentTab === "favorites" ? favorites : allRecipes;

    const filtered = sourceRecipes.filter(recipe => {
      const matchName = recipe.name.toLowerCase().includes(keyword);
      const matchCuisine = !selectedCuisine || recipe.cuisine === selectedCuisine;
      const matchDifficulty = !selectedDifficulty || recipe.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();
      
      return matchName && matchCuisine && matchDifficulty;
    });

    renderRecipes(filtered);
  }

  // Event Listeners
  if (favoriteBtn) {
    favoriteBtn.addEventListener("click", () => {
      if (currentTab === "all") {
        currentTab = "favorites";
        if (sectionTitle) sectionTitle.textContent = "Favorite Recipes";
        favoriteBtn.classList.add("active");
      } else {
        currentTab = "all";
        if (sectionTitle) sectionTitle.textContent = "Explore Recipes";
        favoriteBtn.classList.remove("active");
      }
      applyFilters();
    });
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  if (searchInput) searchInput.addEventListener("input", applyFilters);
  if (cuisineFilter) cuisineFilter.addEventListener("change", applyFilters);
  if (difficultyFilter) difficultyFilter.addEventListener("change", applyFilters);

  if (resetFilterBtn) {
    resetFilterBtn.addEventListener("click", () => {
      if (searchInput) searchInput.value = "";
      if (cuisineFilter) cuisineFilter.value = "";
      if (difficultyFilter) difficultyFilter.value = "";
      applyFilters();
    });
  }

  // Tambah / Hapus Resep Favorit
  function toggleFavorite(id) {
    const recipe = allRecipes.find(item => item.id === id);
    const index = favorites.findIndex(fav => fav.id === id);

    if (index === -1) {
      favorites.push(recipe);
    } else {
      favorites.splice(index, 1);
    }

    localStorage.setItem("favorites", JSON.stringify(favorites));
    updateFavBadge();
    applyFilters();
  }

  function updateFavBadge() {
    if (favoriteCount) {
      favoriteCount.textContent = favorites.length;
    }
  }

  // Modal Detail Resep
  function showDetail(id) {
    const recipe = allRecipes.find(item => item.id === id);
    if (!recipe || !recipeDialog || !dialogContent) return;

    dialogContent.innerHTML = `
      <h2 style="margin-bottom:8px;">${recipe.name}</h2>
      <p style="color:#64748b; font-size:0.85rem; margin-bottom:12px;">
        <strong>Cuisine:</strong> ${recipe.cuisine} | <strong>Difficulty:</strong> ${recipe.difficulty}
      </p>
      <img src="${recipe.image}" alt="${recipe.name}" style="width:100%; height:200px; object-fit:cover; border-radius:8px; margin-bottom:16px;">
      
      <h3 style="font-size:1rem; margin-bottom:6px;">Bahan-bahan:</h3>
      <ul style="padding-left:20px; font-size:0.85rem; margin-bottom:16px; color:#334155;">
        ${recipe.ingredients.map(ing => `<li>${ing}</li>`).join("")}
      </ul>
      
      <h3 style="font-size:1rem; margin-bottom:6px;">Instruksi:</h3>
      <ol style="padding-left:20px; font-size:0.85rem; color:#334155;">
        ${recipe.instructions.map(step => `<li style="margin-bottom:4px;">${step}</li>`).join("")}
      </ol>
    `;

    recipeDialog.showModal();
  }

  if (closeDialog) {
    closeDialog.addEventListener("click", () => {
      recipeDialog.close();
    });
  }

  // Inisialisasi Aplikasi
  getRecipes();


  // penjelasan
//   Inisialisasi & DOM: Menentukan endpoint API, membuat state (allRecipes, favorites, currentTab), dan menangkap elemen HTML untuk manipulasi DOM.

// getRecipes(): Mengambil data dari API secara asynchronous (fetch), menyimpan ke allRecipes, lalu menjalankan pembaruan filter, indikator favorit, dan opsi cuisine.

// populateCuisineOptions(): Mengambil semua nama cuisine unik dari data resep menggunakan Set dan memasukkannya ke dalam dropdown filter.

// applyFilters(): Menyaring resep berdasarkan kata kunci pencarian, cuisine, dan tingkat kesulitan. Sumber data otomatis menyesuaikan tab aktif (allRecipes atau favorites).

// renderRecipes(): Mengubah data resep hasil filter menjadi elemen kartu HTML. Menampilkan empty state jika data tidak ditemukan/kosong.

// toggleFavorite() & updateFavBadge(): Menambah/menghapus resep dari favorit, memperbarui angka di navbar, dan menyimpan data ke localStorage.

// Event Listeners: Menangani interaksi pengguna seperti pencarian, perubahan filter, tombol reset, dan perpindahan tab (All vs Favorites).

// showDetail(): Mengambil data resep berdasarkan ID dan menampilkannya di dalam modal <dialog> (bahan-bahan & instruksi memasak).