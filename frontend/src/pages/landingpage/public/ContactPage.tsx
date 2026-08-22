export function ContactPage() {
    return (
        <main className="contact-page">
            <section className="contact-hero section">
                <div className="container">
                    {/* Header reproduisant le style de l'image */}
                    <div className="contact-header">
                        <h1 className="contact-title">Contactez nous</h1>
                        <p className="contact-eyebrow">EMAIL</p>
                        <p className="contact-email">
                            <a href="mailto:mamadoulaminedevdiallo@gmail.com">mamadoulaminedevdiallo@gmail.com</a>
                        </p>
                    </div>

                    <div className="contact-form-wrapper">
                        <form className="contact-form" onSubmit={e => e.preventDefault()}>
                            <div className="field">
                                <label htmlFor="email">Adresse e-mail</label>
                                <div className="field-input">
                                    <input id="email" name="email" type="email" placeholder="vous@exemple.com" required />
                                </div>
                            </div>

                            <div className="field">
                                <label htmlFor="message">Message</label>
                                <div className="field-textarea">
                                    <textarea id="message" name="message" rows={5} placeholder="Votre message..." required></textarea>
                                </div>
                            </div>

                            <div className="contact-form-footer">
                                <div className="contact-info-inline">
                                    <a href="https://wa.me/224611224698" target="_blank" rel="noopener noreferrer" className="contact-info-item" title="Nous écrire sur WhatsApp">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp" width="28" height="28" />
                                        <span>+224 611 22 46 98</span>
                                    </a>
                                    <a href="mailto:mamadoulaminedevdiallo@gmail.com" className="contact-info-item" title="Nous envoyer un email">
                                        <img src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" width="28" height="28" />
                                        <span>mamadoulaminedevdiallo@gmail.com</span>
                                    </a>
                                </div>
                                <button type="submit" className="btn btn-primary btn-lg">
                                    Envoyer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </section>
        </main>
    )
}
