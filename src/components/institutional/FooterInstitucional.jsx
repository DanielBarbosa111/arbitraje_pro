// =====================================================
// Footer Institucional — Centro Tecnológico de Cúcuta
// Idéntico al de Sistema Gestión Aulas V5
// =====================================================

export default function FooterInstitucional() {
  return (
    <footer className="sena-footer">
      {/* Líneas decorativas de fondo */}
      <div className="finance-flows">
        <div className="flow-line"></div>
        <div className="flow-line"></div>
        <div className="flow-line"></div>
        <div className="flow-line"></div>
        <div className="flow-line"></div>
        <div className="flow-line"></div>
        <div className="flow-node"></div>
        <div className="flow-node"></div>
        <div className="flow-node"></div>
      </div>

      <div className="footer-container">
        {/* Columna 1: Información Institucional */}
        <div className="footer-column">
          <h3>Información Institucional</h3>
          <a href="#">Inicio</a>
          <a href="#">Nosotros</a>
          <a href="#">Transparencia</a>
          <a href="#">Q10</a>
          <a href="#">Programas</a>
          <a href="#">Estudiantes</a>
          <a href="#">PQRSFD</a>
        </div>

        {/* Columna 2: Programas y Servicios */}
        <div className="footer-column">
          <h3>Programas y Servicios</h3>
          <a href="#">Directorio de Funcionarios</a>
          <a href="#">Programa de Inglés General</a>
          <a href="#">Programas Técnicos Laborales</a>
          <a href="#">Convocatorias CTC</a>
          <a href="#">Investigación</a>
          <a href="#">Emprendimiento</a>
          <a href="#">Preguntas Frecuentes</a>
        </div>

        {/* Columna 3: Contacto General */}
        <div className="footer-column">
          <h3>Contacto General</h3>
          <p><strong>Centro Tecnológico de Cúcuta</strong></p>
          <p><strong>Dirección:</strong> Av.6 # 3-20 Barrio Comuneros, Ciudadela Juan Atalaya, Cúcuta</p>
          <p><strong>Teléfono:</strong> +57 324 4114095</p>
          <p><strong>Horario:</strong> 7:30 am a 11:30 am / 2:00 pm a 6:00 pm</p>
        </div>

        {/* Columna 4: Contacto Específico */}
        <div className="footer-column">
          <h3>Contacto Específico</h3>
          <p><strong>Teléfono:</strong> +57 324 4114095</p>
          <p><strong>Correspondencia:</strong> <a href="mailto:ctecnologicocucuta@gmail.com">ctecnologicocucuta@gmail.com</a></p>
          <p><strong>Notificaciones judiciales:</strong> <a href="mailto:juridicoctc@gmail.com">juridicoctc@gmail.com</a></p>
          <p><strong>Secretaría General:</strong> <a href="mailto:secretariageneralctc@gmail.com">secretariageneralctc@gmail.com</a></p>
          <p><a href="#" className="radicacion-link">Clic aquí para radicación web</a></p>
        </div>

        {/* Columna 5: Redes Sociales */}
        <div className="footer-column">
          <h3>Redes Sociales</h3>
          <a href="#"><i className="fab fa-facebook-f"></i> Facebook</a>
          <a href="#"><i className="fab fa-instagram"></i> Instagram</a>
          <a href="#"><i className="fab fa-twitter"></i> Twitter</a>
          <a href="#"><i className="fab fa-youtube"></i> YouTube</a>
          <a href="#"><i className="fab fa-whatsapp"></i> WhatsApp</a>
        </div>

        {/* Columna 6: Aliados */}
        <div className="footer-column footer-aliados">
          <h3>Aliados</h3>
          <div className="aliados-grid">
            <img src="/images/Cucuta.png"         alt="Alcaldía de Cúcuta" />
            <img src="/images/Secretaria.png"      alt="Secretaría de Educación" />
            <img src="/images/Mineducacion.png"    alt="Ministerio de Educación" />
            <img src="/images/ServicioEmpleo.png"  alt="Servicio de Empleo" />
            <img src="/images/Gov.Co.png"          alt="GOV.CO" />
            <img src="/images/Colombia.png"        alt="Colombia" />
          </div>
        </div>
      </div>
    </footer>
  );
}