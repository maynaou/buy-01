package com.example.order_service.feign;

import feign.RequestInterceptor;
import feign.RequestTemplate;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Feign interceptor that forwards the X-User-Id and X-User-Role headers
 * (originally set by the API Gateway) to every outbound Feign call.
 *
 * Without this, inter-service calls arrive at product-service with no
 * authentication headers, causing a 403 Forbidden.
 */
public class FeignAuthInterceptor implements RequestInterceptor {

    private static final String HEADER_USER_ID   = "X-User-Id";
    private static final String HEADER_USER_ROLE = "X-User-Role";

    @Override
    public void apply(RequestTemplate template) {
        ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();

        if (attrs == null) {
            return; // no active HTTP request (e.g., scheduled task) — skip
        }

        HttpServletRequest request = attrs.getRequest();

        String userId = request.getHeader(HEADER_USER_ID);
        String role   = request.getHeader(HEADER_USER_ROLE);

        if (userId != null) {
            template.header(HEADER_USER_ID, userId);
        }
        if (role != null) {
            template.header(HEADER_USER_ROLE, role);
        }
    }
}
