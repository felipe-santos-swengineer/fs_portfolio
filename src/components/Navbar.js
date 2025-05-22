import React, { useState } from "react";
import "../styles/Navbar.css";

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);
    const [page, setPage] = useState("inicio");
    const toggleMenu = () => setMenuOpen(!menuOpen);
    const closeMenu = (currentPage) => {
        setPage(currentPage);
        setMenuOpen(false);
    }

    return (
        <header className="navbar">
            <div className="navbar-container">
                <div className="logo" onClick={() => closeMenu("inicio")} style={{ userSelect: 'none', cursor: 'pointer' }}>{"</> Felipe Santos"}</div>
                <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
                    <div onClick={() => closeMenu("inicio")} className={page === "inicio" ? "option-selected" : "option-unselected"}>Início</div>
                    <div onClick={() => closeMenu("sobre")} className={page === "sobre" ? "option-selected" : "option-unselected"}>Sobre</div>
                    <div onClick={() => closeMenu("projetos")} className={page === "projetos" ? "option-selected" : "option-unselected"}>Projetos</div>
                    <div onClick={() => closeMenu("contato")} className={page === "contato" ? "option-selected" : "option-unselected"}>Contato</div>
                </nav>
                <div className="menu-toggle" onClick={toggleMenu}>
                    <div className={`hamburger ${menuOpen ? "open" : ""}`}></div>
                </div>
            </div>
        </header>
    );
}