import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Table, Tooltip, Modal, Tabs } from 'choerodon-ui';
import { Content, Header, Page } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import SagaImg from './SagaImg';
import jsonFormat from '../../../common/json-format';
import SagaStore from '../../../stores/global/saga/SagaStore';
import './style/saga.scss';
import './style/json.scss';

const intlPrefix = 'global.saga';
const { Sidebar } = Modal;
const { TabPane } = Tabs;

@injectIntl
@inject('AppState')
@observer
export default class Saga extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.reload();
  }

  getInitState() {
    return {
      visible: false,
      pagination: {
        current: 1,
        pageSize: 10,
        total: 0,
      },
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      filters: {},
      params: [],
      showJson: false,
      data: {},
    };
  }

  reload = (paginationIn, filtersIn, sortIn, paramsIn) => {
    const {
      pagination: paginationState,
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const pagination = paginationIn || paginationState;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    this.setState({
      loading: true,
    });
    SagaStore.loadData(pagination, filters, sort, params).then((data) => {
      SagaStore.setData(data.content);
      this.setState({
        pagination: {
          current: data.number + 1,
          pageSize: data.size,
          total: data.totalElements,
        },
        loading: false,
        sort,
        filters,
        params,
      });
    });
  }

  tableChange = (pagination, filters, sort, params) => {
    this.reload(pagination, filters, sort, params);
  }

  openSidebar = (id) => {
    SagaStore.loadDetailData(id).then((data) => {
      this.setState({
        data,
      }, () => {
        this.setState({
          visible: true,
        });
      });
    });
  }
  handleOk = () => {
    this.setState({
      visible: false,
    }, () => {
      this.setState({
        showJson: false,
      });
    });
  }
  handleTabChange = (showJson) => {
    this.setState({
      showJson: showJson === 'json',
    });
  }
  renderTable() {
    const { intl } = this.props;
    const { filters } = this.state;
    const dataSource = SagaStore.getData.slice();
    const columns = [
      {
        title: <FormattedMessage id={`${intlPrefix}.code`} />,
        key: 'code',
        dataIndex: 'code',
        filters: [],
        filteredValue: filters.code || [],
      },
      {
        title: <FormattedMessage id={`${intlPrefix}.service`} />,
        key: 'service',
        dataIndex: 'service',
        filters: [],
        filteredValue: filters.service || [],
      },
      {
        title: <FormattedMessage id={`${intlPrefix}.desc`} />,
        key: 'description',
        dataIndex: 'description',
        filters: [],
        filteredValue: filters.description || [],
      },
      {
        title: '',
        width: '100px',
        key: 'action',
        align: 'right',
        render: (text, record) => (
          <div>
            <Tooltip
              title={<FormattedMessage id="detail" />}
              placement="bottom"
            >
              <Button
                icon="find_in_page"
                size="small"
                shape="circle"
                onClick={this.openSidebar.bind(this, record.id)}
              />
            </Tooltip>
          </div>
        ),
      },
    ];
    return (
      <Table
        loading={this.state.loading}
        pagination={this.state.pagination}
        columns={columns}
        indentSize={0}
        dataSource={dataSource}
        filters={this.state.params}
        rowKey="id"
        onChange={this.tableChange}
        filterBarPlaceholder={intl.formatMessage({ id: 'filtertable' })}
      />
    );
  }

  render() {
    const { showJson, data } = this.state;
    return (
      <Page
        className="c7n-saga"
        service={[
          'asgard-service.saga.pagingQuery',
          'asgard-service.saga.query',
        ]}
      >
        <Header title={<FormattedMessage id={`${intlPrefix}.header.title`} />}>
          <Button
            icon="refresh"
            onClick={() => {
              this.setState(this.getInitState(), () => {
                this.reload();
              });
            }}
          >
            <FormattedMessage id="refresh" />
          </Button>
        </Header>
        <Content
          code={intlPrefix}
        >
          {this.renderTable()}
          <Sidebar
            title={<FormattedMessage id={`${intlPrefix}.detail`} />}
            onOk={this.handleOk}
            okText={<FormattedMessage id="close" />}
            okCancel={false}
            visible={this.state.visible}
            className="c7n-saga-sidebar"
          >
            <Content
              className="sidebar-content"
              code={`${intlPrefix}.detail`}
            >
              <Tabs activeKey={showJson ? 'json' : 'img'} onChange={this.handleTabChange}>
                <TabPane tab={<FormattedMessage id={`${intlPrefix}.img`} />} key="img" />
                <TabPane tab={<FormattedMessage id={`${intlPrefix}.json`} />} key="json" />
              </Tabs>
              {showJson
                ? (<div className="c7n-saga-detail-json"><pre><code id="json">{jsonFormat(data)}</code></pre></div>)
                : (<SagaImg data={data} />)
              }
            </Content>
          </Sidebar>
        </Content>
      </Page>
    );
  }
}
