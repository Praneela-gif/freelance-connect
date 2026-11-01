package com.freelance.project.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Value("${spring.datasource.url:${DATABASE_URL:jdbc:postgresql://localhost:5432/freelancedb}}")
    private String rawUrl;

    @Value("${spring.datasource.username:${DATABASE_USERNAME:postgres}}")
    private String username;

    @Value("${spring.datasource.password:${DATABASE_PASSWORD:postgres}}")
    private String password;

    @Value("${spring.datasource.driver-class-name:org.postgresql.Driver}")
    private String driverClassName;

    @Bean
    @Primary
    public DataSource dataSource() {
        HikariConfig config = new HikariConfig();
        String jdbcUrl = rawUrl;
        String user = username;
        String pass = password;

        if (rawUrl != null && (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://"))) {
            try {
                URI uri = new URI(rawUrl);
                String host = uri.getHost();
                int port = uri.getPort() == -1 ? 5432 : uri.getPort();
                String path = uri.getPath();

                if (uri.getUserInfo() != null) {
                    String[] userInfo = uri.getUserInfo().split(":");
                    user = userInfo[0];
                    if (userInfo.length > 1) {
                        pass = userInfo[1];
                    }
                }

                String query = uri.getQuery() != null ? "?" + uri.getQuery() : "";
                jdbcUrl = "jdbc:postgresql://" + host + ":" + port + path + query;
                log.info("Converted Render database URL to standard JDBC: {}", jdbcUrl);
            } catch (Exception e) {
                jdbcUrl = rawUrl.replaceFirst("^postgres(ql)?://", "jdbc:postgresql://");
            }
        }

        config.setJdbcUrl(jdbcUrl);
        config.setUsername(user);
        config.setPassword(pass);
        config.setDriverClassName(driverClassName);
        return new HikariDataSource(config);
    }
}