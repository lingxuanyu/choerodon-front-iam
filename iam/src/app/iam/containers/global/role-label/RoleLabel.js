import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Button, Table } from 'choerodon-ui';
import { Content, Header, Page } from 'choerodon-front-boot';
import { injectIntl, FormattedMessage } from 'react-intl';
import RoleLabelStore from '../../../stores/global/role-label/RoleLabelStore';

const intlPrefix = 'global.rolelabel';

@injectIntl
@inject('AppState')
@observer
export default class RoleLabel extends Component {
  state = this.getInitState();

  componentWillMount() {
    this.reload();
  }

  getInitState() {
    return {
      visible: false,
      sort: {
        columnKey: 'id',
        order: 'descend',
      },
      filters: {},
      params: [],
      submitting: false,
    };
  }

  reload = (filtersIn, sortIn, paramsIn) => {
    const {
      sort: sortState,
      filters: filtersState,
      params: paramsState,
    } = this.state;
    const sort = sortIn || sortState;
    const filters = filtersIn || filtersState;
    const params = paramsIn || paramsState;
    this.setState({
      loading: true,
    });
    RoleLabelStore.loadData(filters, sort, params).then((data) => {
      RoleLabelStore.setData(data);
      this.setState({
        loading: false,
        sort,
        filters,
        params,
      });
    });
  }

  tableChange = (pagination, filters, sort, params) => {
    this.reload(filters, sort, params);
  }

  renderLevel(level) {
    const { intl } = this.props;
    if (level === 'site') {
      return intl.formatMessage({ id: 'global' });
    } else if (level === 'organization') {
      return intl.formatMessage({ id: 'organization' });
    } else {
      return intl.formatMessage({ id: 'project' });
    }
  }

  renderTable() {
    const { intl } = this.props;
    const { filters } = this.state;
    const dataSource = RoleLabelStore.getData.slice();
    const columns = [
      {
        title: <FormattedMessage id={`${intlPrefix}.name`} />,
        key: 'name',
        dataIndex: 'name',
        filters: [],
        filteredValue: filters.name || [],
      },
      {
        title: <FormattedMessage id={`${intlPrefix}.level`} />,
        key: 'level',
        dataIndex: 'level',
        filters: [
          {
            text: intl.formatMessage({ id: 'global' }),
            value: 'site',
          }, {
            text: intl.formatMessage({ id: 'organization' }),
            value: 'organization',
          }, {
            text: intl.formatMessage({ id: 'project' }),
            value: 'project',
          }],
        filteredValue: filters.level || [],
        render: level => this.renderLevel(level),
      },
      {
        title: <FormattedMessage id={`${intlPrefix}.desc`} />,
        key: 'description',
        dataIndex: 'description',
        filters: [],
        filteredValue: filters.description || [],
      },
    ];
    return (
      <Table
        loading={this.state.loading}
        pagination={false}
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
    return (
      <Page
        className="role-label"
        service={[
          'iam-service.label.listByType',
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
        </Content>
      </Page>
    );
  }
}
