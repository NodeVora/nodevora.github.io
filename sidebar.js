export function initSidebar() {

  const sidebar = document.getElementById("sidebar");
  const collapseBtn = document.getElementById("collapseBtn");

  let collapsed = localStorage.getItem("sidebarCollapsed") === "true";

  function apply() {
    if (collapsed) {
      sidebar.classList.add("collapsed");
      document.body.classList.add("sidebar-collapsed");
    } else {
      sidebar.classList.remove("collapsed");
      document.body.classList.remove("sidebar-collapsed");
    }
  }

  collapseBtn.onclick = () => {
    collapsed = !collapsed;
    localStorage.setItem("sidebarCollapsed", collapsed);
    apply();
  };

  apply();
}
