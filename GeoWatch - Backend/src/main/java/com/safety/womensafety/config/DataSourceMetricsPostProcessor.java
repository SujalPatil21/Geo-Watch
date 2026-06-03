package com.safety.womensafety.config;

import com.safety.womensafety.service.MetricsService;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.Set;

@Configuration
public class DataSourceMetricsPostProcessor implements BeanPostProcessor {

    private final MetricsService metricsService;
    private final Set<Object> wrappedBeans = Collections.synchronizedSet(
            Collections.newSetFromMap(new IdentityHashMap<>())
    );

    public DataSourceMetricsPostProcessor(@org.springframework.context.annotation.Lazy MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource) {
            if (wrappedBeans.contains(bean)) {
                return bean;
            }
            DataSource wrapped = MetricsProxyDataSource.wrap((DataSource) bean, metricsService);
            wrappedBeans.add(wrapped);
            wrappedBeans.add(bean);
            return wrapped;
        }
        return bean;
    }
}
