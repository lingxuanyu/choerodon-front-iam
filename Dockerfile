FROM registry.cn-hangzhou.aliyuncs.com/choerodon-tools/frontbase:0.5.1

ENV PRO_API_HOST gateway.choerodon.com.cn
ENV PRO_CLIENT_ID choerodon
ENV PRO_LOCAL true
ENV PRO_TITLE_NAME Choerodon
ENV PRO_HEADER_TITLE_NAME Choerodon
ENV PRO_COOKIE_SERVER choerodon.com.cn
ENV PRO_HTTP http

RUN echo "Asia/shanghai" > /etc/timezone;
ADD dist /usr/share/nginx/html
COPY structure/enterpoint.sh /usr/share/nginx/html
COPY config.yml /usr/share/nginx/html
COPY structure/sql.py /usr/share/nginx/html
RUN chmod 777 /usr/share/nginx/html/enterpoint.sh
ENTRYPOINT ["/usr/share/nginx/html/enterpoint.sh"]
CMD ["nginx", "-g", "daemon off;"]

EXPOSE 80
