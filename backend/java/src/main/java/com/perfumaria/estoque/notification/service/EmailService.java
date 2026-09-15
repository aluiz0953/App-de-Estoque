package com.perfumaria.estoque.notification.service;

import com.perfumaria.estoque.model.Usuario;
import com.perfumaria.estoque.model.Usuario.Role;
import com.perfumaria.estoque.notification.Notificacao;
import com.perfumaria.estoque.notification.repository.NotificacaoRepository;
import com.perfumaria.estoque.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service responsible for processing notifications and sending daily HTML emails.
 * Consumes the notification queue, compiles alerts into a single daily email,
 * validates user permissions, and sends formatted HTML notifications.
 */
@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private SpringTemplateEngine templateEngine;

    @Autowired
    private NotificacaoRepository notificacaoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    // Email configuration - in a real app, these would come from application.properties
    private static final String FROM_EMAIL = "estoque@perfumaria.com";
    private static final String EMAIL_SUBJECT = "Relatório Diário de Estoque - Perfumaria";

    /**
     * Scheduled task that runs daily to send the notification email.
     * This method compiles all processed notifications from the day and sends them
     * to users with appropriate permissions.
     */
    @Scheduled(cron = "0 30 7 * * *") // Runs every day at 7:30 AM (30 minutes after notification generation)
    public void enviarRelatorioDiario() {
        // Get notifications processed today (status PROCESSADO from today)
        LocalDate hoje = LocalDate.now();
        LocalDateTime inicioDoDia = hoje.atStartOfDay();
        LocalDateTime fimDoDia = hoje.atTime(23, 59, 59);

        List<Notificacao> notificacoesDoDia = notificacaoRepository.findByDataProcessamentoBetweenAndStatus(
                inicioDoDia, fimDoDia, Notificacao.StatusNotificacao.PROCESSADO);

        if (notificacoesDoDia.isEmpty()) {
            // No notifications to send
            return;
        }

        // Get users who should receive the email (managers, auditors, admins)
        List<Usuario> destinatarios = usuarioRepository.findByRoleInAndActiveTrue(
                List.of(Role.ADMIN, Role.MANAGER, Role.AUDITOR));

        if (destinatarios.isEmpty()) {
            // No authorized users to send to
            return;
        }

        // Send email to each authorized user
        for (Usuario destinatario : destinatarios) {
            try {
                enviarEmailNotificacoes(destinatario, notificacoesDoDia);

                // Mark notifications as sent
                for (Notificacao notificacao : notificacoesDoDia) {
                    notificacao.setStatus(Notificacao.StatusNotificacao.ENVIADO);
                    notificacao.setDataEnvio(LocalDateTime.now());
                    notificacaoRepository.save(notificacao);
                }
            } catch (MessagingException e) {
                // In a real app, we would log this error
                // For now, we'll just continue to the next user
                // Notifications will remain as PROCESSADO and can be retried
                continue;
            }
        }
    }

    /**
     * Sends an HTML email with the list of notifications.
     *
     * @param destinatario The user to send the email to
     * @param notificacoes The list of notifications to include
     * @throws MessagingException If there's an error sending the email
     */
    private void enviarEmailNotificacoes(Usuario destinatario, List<Notificacao> notificacoes) throws MessagingException {
        MimeMessage mensagem = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mensagem, true, "UTF-8");

        helper.setFrom(FROM_EMAIL);
        helper.setTo(destinatario.getEmail());
        helper.setSubject(EMAIL_SUBJECT);

        // Create HTML content
        String htmlContent = gerarConteudoHTML(notificacoes, destinatario.getNome());
        helper.setText(htmlContent, true); // true = isHTML

        mailSender.send(mensagem);
    }

    /**
     * Generates the HTML content for the email notification.
     *
     * @param notificacoes The list of notifications to include
     * @param nomeDestinatario The recipient's name for personalization
     * @return HTML formatted email content
     */
    private String gerarConteudoHTML(List<Notificacao> notificacoes, String nomeDestinatario) {
        // Group notifications by type
        Map<Notificacao.TipoNotificacao, List<Notificacao>> notificacoesPorTipo = notificacoes.stream()
                .collect(Collectors.groupingBy(Notificacao::getTipo));

        // Create Thymeleaf context
        Context context = new Context();
        context.setVariable("nomeDestinatario", nomeDestinatario);
        context.setVariable("data", LocalDate.now());
        context.setVariable("notificacoesPorTipo", notificacoesPorTipo);
        context.setVariable("totalNotificacoes", notificacoes.size());

        // In a real implementation, we would use a Thymeleaf template
        // For now, we'll generate the HTML directly
        return gerarHTMLSimples(notificacoesPorTipo, nomeDestinatario);
    }

    /**
     * Generates simple HTML content for the email (without Thymeleaf template).
     * In a production environment, this would use a proper template engine.
     *
     * @param notificacoesPorTipo Notifications grouped by type
     * @param nomeDestinatario The recipient's name
     * @return HTML formatted email content
     */
    private String gerarHTMLSimples(Map<Notificacao.TipoNotificacao, List<Notificacao>> notificacoesPorTipo, String nomeDestinatario) {
        StringBuilder html = new StringBuilder();

        html.append("<!DOCTYPE html>");
        html.append("<html>");
        html.append("<head>");
        html.append("<meta charset=\"UTF-8\">");
        html.append("<title>").append(EMAIL_SUBJECT).append("</title>");
        html.append("<style>");
        html.append("body { font-family: 'Inter', sans-serif; margin: 0; padding: 20px; background-color: #F8F9FA; }");
        html.append(".container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }");
        html.append(".header { background: linear-gradient(135deg, #5B2C6F, #D4AF37); color: white; padding: 30px; text-align: center; }");
        html.append(".header h1 { margin: 0; font-size: 24px; }");
        html.append(".header p { margin: 10px 0 0; opacity: 0.9; }");
        html.append(".content { padding: 30px; }");
        html.append(".summary { background-color: #F8F9FA; border-left: 4px solid #5B2C6F; padding: 20px; margin-bottom: 30px; border-radius: 0 4px 4px 0; }");
        html.append(".section { margin-bottom: 30px; }");
        html.append(".section h2 { color: #2C3E50; border-bottom: 2px solid #D4AF37; padding-bottom: 10px; }");
        html.append(".notification { background-color: #F8F9FA; border: 1px solid #E0E0E0; border-radius: 8px; padding: 20px; margin-bottom: 15px; }");
        html.append(".notification.critical { border-left: 4px solid #E74C3C; }");
        html.append(".notification.expiring { border-left: 4px solid #F39C12; }");
        html.append(".notification.expired { border-left: 4px solid #E74C3C; background-color: #FDEDEC; }");
        html.append(".notification h3 { margin-top: 0; color: #2C3E50; }");
        html.append(".notification p { margin: 10px 0; color: #34495E; }");
        html.append(".notification .details { background-color: white; padding: 10px; border-radius: 4px; font-size: 14px; margin-top: 10px; }");
        html.append(".footer { text-align: center; padding: 20px; color: #7F8C8D; font-size: 14px; border-top: 1px solid #EEEEEE; }");
        html.append(".badge { display: inline-block; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; text-transform: uppercase; }");
        html.append(".badge.critical { background-color: #E74C3C; color: white; }");
        html.append(".badge.expiring { background-color: #F39C12; color: white; }");
        html.append(".badge.expired { background-color: #E74C3C; color: white; }");
        html.append("</style>");
        html.append("</head>");
        html.append("<body>");
        html.append("<div class=\"container\">");
        html.append("<div class=\"header\">");
        html.append("<h1>📊 Relatório Diário de Estoque</h1>");
        html.append("<p>Perfumaria - ").append(LocalDate.now().getYear()).append("</p>");
        html.append("</div>");

        html.append("<div class=\"content\">");
        html.append("<p>Olá, ").append(nomeDestinatario).append(",</p>");
        html.append("<p>Segue o relatório diário de estoque com as alertas geradas até agora:</p>");

        // Summary
        html.append("<div class=\"summary\">");
        html.append("<h3>Resumo</h3>");
        html.append("<p><strong>Total de notificações:</strong> ").append(notificacoes.size()).append("</p>");
        html.append("<p><strong>Data do relatório:</strong> ").append(LocalDate.now()).append("</p>");
        html.append("</div>");

        // Critical Stock Section
        List<Notificacao> criticas = notificacoesPorTipo.getOrDefault(Notificacao.TipoNotificacao.ESTOQUE_CRITICO, java.util.Collections.emptyList());
        if (!criticas.isEmpty()) {
            html.append("<div class=\"section\">");
            html.append("<h2>🚨 Estoque Crítico</h2>");
            html.append("<p>Os seguintes produtos estão com estoque abaixo do nível mínimo:</p>");
            for (Notificacao notif : criticas) {
                html.append("<div class=\"notification critical\">");
                html.append("<h3>").append(notif.getTitulo()).append("</h3>");
                html.append("<p>").append(notif.getMensagem()).append("</p>");
                if (notif.getDadosAdicionais() != null && !notif.getDadosAdicionais().isEmpty()) {
                    html.append("<div class=\"details\">").append(notif.getDadosAdicionais()).append("</div>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        // Expiring Soon Section
        List<Notificacao> expirando = notificacoesPorTipo.getOrDefault(Notificacao.TipoNotificacao.VENCIMENTO_PROXIMO, java.util.Collections.emptyList());
        if (!expirando.isEmpty()) {
            html.append("<div class=\"section\">");
            html.append("<h2>⏰ Próximos do Vencimento</h2>");
            html.append("<p>Os seguintes lotes estão prestes a vencer (próximos 30 dias):</p>");
            for (Notificacao notif : expirando) {
                html.append("<div class=\"notification expiring\">");
                html.append("<h3>").append(notif.getTitulo()).append("</h3>");
                html.append("<p>").append(notif.getMensagem()).append("</p>");
                if (notif.getDadosAdicionais() != null && !notif.getDadosAdicionais().isEmpty()) {
                    html.append("<div class=\"details\">").append(notif.getDadosAdicionais()).append("</div>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        // Expired Section
        List<Notificacao> vencidas = notificacoesPorTipo.getOrDefault(Notificacao.TipoNotificacao.VENCIDO, java.util.Collections.emptyList());
        if (!vencidas.isEmpty()) {
            html.append("<div class=\"section\">");
            html.append("<h2>☠️ Produtos Vencidos</h2>");
            html.append("<p>Os seguintes lotes estão vencidos e devem ser removidos do estoque:</p>");
            for (Notificacao notif : vencidas) {
                html.append("<div class=\"notification expired\">");
                html.append("<h3>").append(notif.getTitulo()).append("</h3>");
                html.append("<p>").append(notif.getMensagem()).append("</p>");
                if (notif.getDadosAdicionais() != null && !notif.getDadosAdicionais().isEmpty()) {
                    html.append("<div class=\"details\">").append(notif.getDadosAdicionais()).append("</div>");
                }
                html.append("</div>");
            }
            html.append("</div>");
        }

        // If no notifications
        if (criticas.isEmpty() && expirando.isEmpty() && vencidas.isEmpty()) {
            html.append("<div class=\"section\">");
            html.append("<h2>✅ Tudo Normal</h2>");
            html.append("<p>Não há alertas de estoque crítico ou vencimento para hoje.</p>");
            html.append("</div>");
        }

        html.append("</div>"); // content

        html.append("<div class=\"footer\">");
        html.append("<p>Este é um e-mail automático do Sistema de Gestão de Estoque da Perfumaria.</p>");
        html.append("<p>© ").append(LocalDate.now().getYear()).append(" Perfumaria. Todos os direitos reservados.</p>");
        html.append("</div>");

        html.append("</div>"); // container
        html.append("</body>");
        html.append("</html>");

        return html.toString();
    }
}