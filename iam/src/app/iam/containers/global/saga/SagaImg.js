import React, { Component } from 'react';
import { Icon, Tabs } from 'choerodon-ui';
import { inject, observer } from 'mobx-react';
import { injectIntl, FormattedMessage } from 'react-intl';
import classnames from 'classnames';
import SagaInstanceStore from '../../../stores/global/saga-instance/SagaInstanceStore';
import jsonFormat from '../../../common/json-format';
import SagaStore from '../../../stores/global/saga/SagaStore';
import './style/saga-img.scss';
import './style/saga.scss';
import './style/json.scss';

const intlPrefix = 'global.saga';
const { TabPane } = Tabs;

@injectIntl
export default class SagaImg extends Component {
  state = this.getInitState();
  getInitState() {
    const { instance, data } = this.props;
    return {
      showDetail: false,
      task: {},
      json: '',
      lineData: {},
      activeCode: '',
      activeTab: instance ? 'run' : 'detail',
      jsonTitle: false, // 是否展示input output
      data,
    };
  }

  constructor(props) {
    super(props);
    this.taskDetail = React.createRef();
    this.taskImg = React.createRef();
  }

  componentWillMount() {
    const { data: { tasks } } = this.state;
    this.getLineData(tasks);
  }

  componentDidMount() {
    this.addScrollEventListener();
  }


  getSidebarContainer() {
    const content = document.body.getElementsByClassName('ant-modal-sidebar')[0];
    return content.getElementsByClassName('ant-modal-body')[0];
  }

  addScrollEventListener() {
    const container = this.getSidebarContainer();
    container.addEventListener('scroll', this.handleScroll.bind(this, container));
  }

  // removeScrollEventListener() {
  //   const container = this.getSidebarContainer();
  //   container.removeEventListener('scroll', this.handleScroll);
  // }

  /**
   * 1. taskImg 超出 detail未超出屏幕高度
   * 2. taskImg 未超出 detail超出屏幕高度 (不做处理)
   * 3. taskImg 未超出 detail也没有超出 (不会有滚动)
   * 4. taskImg 超出 detail也超出  taskImg没有detail超出的多
   * 5. taskImg 超出 detail也超出  taskImg比detail超出的多
   */
  handleScroll = (container) => {
    const imgDom = this.taskImg.current;
    const detail = this.taskDetail.current;
    if (!imgDom) {
      return;
    }
    const imgHeight = imgDom.scrollHeight;
    const top = imgDom.offsetTop;
    if (detail && imgHeight + top > container.clientHeight && imgHeight > detail.scrollHeight) {
      const detailHeight = detail.scrollHeight;
      let detailTop = container.scrollTop;
      if (detailTop > top) {
        if (detailHeight > container.clientHeight) {
          detailTop = Math.min(imgHeight - detailHeight + top, detailTop);
        }
        detail.style.cssText = `top: ${detailTop}px`;
        detail.classList.add('autoscroll');
      } else {
        detail.classList.remove('autoscroll');
        detail.style.cssText = '';
      }
    } else if (detail) {
      detail.classList.remove('autoscroll');
      detail.style.cssText = '';
    }
  }

  reload() {
    const { data: { id } } = this.state;
    const { instance } = this.props;
    const store = instance ? SagaInstanceStore : SagaStore;
    store.loadDetailData(id).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        const { tasks } = data;
        this.setState({ data })
        this.getLineData(tasks);
      }
    });
  }

  componentWillReceiveProps(nextProps) {
    const { data: { tasks } } = nextProps;
    // const { data } = this.props;
    this.setState(this.getInitState(), () => {
      this.setState({ data: nextProps.data });
      this.getLineData(tasks);
    });
  }

  getLineData = (tasks) => {
    const lineData = {};
    const { task: { code, taskCode } } = this.state;
    tasks.forEach(items => items.forEach(
      (task) => { lineData[task.code || task.taskCode] = task; }));
    const task = { ...lineData[code || taskCode] };
    this.setState({
      lineData,
      task,
    });
  }

  circleWrapper = (code) => {
    const { activeCode } = this.state;
    const { instance } = this.props;
    const clsNames = classnames('c7n-saga-img-circle', {
      'c7n-saga-task-active': code.toLowerCase() === activeCode,
      'output': !instance && code === 'Output',
    });
    return (
      <div
        className={clsNames}
        onClick={this.showDetail.bind(this, code.toLowerCase())}
        key={code}
      >
        {code}
      </div>
    );
  };

  squareWrapper = (node, status = '') => {
    if (typeof node === 'string') {
      const { instance } = this.props;
      const { activeCode } = this.state;
      const clsNames = classnames('c7n-saga-img-square', {
        'c7n-saga-task-active': node === activeCode,
        [status.toLowerCase()]: !!instance,
      });
      return (
        <div
          className={clsNames}
          onClick={this.showDetail.bind(this, node)}
          key={node}
        >
          <span>{node}</span>
        </div>
      );
    }
    return (
      <div className="c7n-saga-img-squares">
        {node}
      </div>
    );
  }

  line = () => {
    return (
      <div className="c7n-saga-img-line" />
    );
  };

  showDetail = (code) => {
    const { instance } = this.props;
    if (!instance && code === 'output') {
      return;
    }
    if (code === 'input' || code === 'output') {
      const { intl: { formatMessage } } = this.props;
      const { data } = this.state;
      this.setState({
        showDetail: false,
        jsonTitle: formatMessage({ id: `${intlPrefix}.task.${code}.title` }),
        json: data[code],
        activeCode: code,
      }, () => {
        const container = this.getSidebarContainer();
        this.handleScroll(container);
      });
      return;
    }
    const { lineData } = this.state;
    const task = { ...lineData[code] };
    this.setState({
      showDetail: true,
      jsonTitle: false,
      task,
      activeCode: code,
    }, () => {
      const container = this.getSidebarContainer();
      this.handleScroll(container);
    });
  }

  handleTabChange = (activeTab) => {
    this.setState({
      activeTab,
    });
  }

  handleUnLock = () => {
    const { task: { id } } = this.state;
    const { intl: { formatMessage } } = this.props;
    SagaInstanceStore.unLock(id).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        this.reload();
        Choerodon.prompt(formatMessage({ id: `${intlPrefix}.task.unlock.success` }));
      }
    });
  }

  handleRetry = () => {
    const { task: { id } } = this.state;
    const { intl: { formatMessage } } = this.props;
    SagaInstanceStore.retry(id).then((data) => {
      if (data.failed) {
        Choerodon.prompt(data.message);
      } else {
        this.reload();
        Choerodon.prompt(formatMessage({ id: `${intlPrefix}.task.retry.success` }));
      }
    });
  }

  handleCopy = () => {
    const { intl: { formatMessage } } = this.props;
    const { task: { exceptionMessage } } = this.state;
    const failed = document.getElementById('failed');
    failed.value = exceptionMessage;
    failed.select();
    document.execCommand('copy');
    Choerodon.prompt(formatMessage({ id: 'copy.success' }));
  }

  renderContent = () => {
    const { data: { tasks } } = this.state;
    const line = this.line();
    const content = [];
    if (tasks.length) {
      content.push(line);
      tasks.forEach((items) => {
        const node = items.map((
          { code, taskCode, status }) => this.squareWrapper(code || taskCode, status));
        if (node.length === 1) {
          content.push(node);
        } else {
          content.push(this.squareWrapper(node));
        }
        content.push(line);
      });
      return content;
    }
    return line;
  }

  renderStatus(status) {
    let obj = {};
    switch (status) {
      case 'RUNNING':
        obj = {
          key: 'running',
          value: '运行中',
        };
        break;
      case 'FAILED':
        obj = {
          key: 'failed',
          value: '失败',
        };
        break;
      case 'QUEUE':
        obj = {
          key: 'queue',
          value: '等待中',
        };
        break;
      case 'COMPLETED':
        obj = {
          key: 'completed',
          value: '完成',
        };
        break;
      default:
        break;
    }
    return (
      <span className={`c7n-saga-status ${obj.key}`}>
        {obj.value}
      </span>
    );
  }

  renderTaskRunDetail = () => {
    const { intl: { formatMessage } } = this.props;
    const { task: {
      code,
      taskCode,
      status,
      seq,
      maxRetryCount,
      retriedCount,
      instanceLock,
      exceptionMessage,
      output,
      plannedStartTime,
      actualStartTime,
      actualEndTime,
    } } = this.state;
    const list = [{
      key: formatMessage({ id: `${intlPrefix}.task.code` }),
      value: code || taskCode,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.run.status` }),
      value: this.renderStatus(status),
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.seq` }),
      value: seq,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.run.service-instance` }),
      value: instanceLock,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.max-retry` }),
      value: maxRetryCount,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.run.retried` }),
      value: retriedCount,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.plannedstarttime` }),
      value: plannedStartTime,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.actualstarttime` }),
      value: actualStartTime,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.actualendtime` }),
      value: actualEndTime,
    }];
    const failed = {
      key: formatMessage({ id: `${intlPrefix}.task.run.exception.msg` }),
      value: exceptionMessage,
    };
    const completed = {
      key: formatMessage({ id: `${intlPrefix}.task.run.result.msg` }),
      value: output ? jsonFormat(JSON.parse(output)) : formatMessage({ id: `${intlPrefix}.json.nodata` }),
    };
    return (
      <div className="c7n-saga-task-run">
        <div className="c7n-saga-task-detail">
          <div className="c7n-saga-task-detail-content">
            {list.map(({ key, value }, index) => <div key={`task-run-${index}`}>{key}: {value}</div>)}
            {status === 'FAILED' && (
              <div>{failed.key}:
                <div className="c7n-saga-detail-json">
                  <pre style={{ maxHeight: '350px' }}><code>{failed.value.trim()}</code></pre>
                  <textarea id="failed" />
                  {failed.value && (
                    <Icon
                      type="library_books"
                      onClick={this.handleCopy}
                    />)}
                </div>
              </div>)}
            {status === 'COMPLETED' && (
              <div>{completed.key}:
                <div className="c7n-saga-detail-json">
                  <pre style={{ maxHeight: '350px' }}><code>{completed.value}</code></pre>
                </div>
              </div>)}
          </div>
        </div>
        <div className="c7n-saga-task-btns">
          {instanceLock && (status === 'RUNNING' || status === 'FAILED') && (
            <span onClick={this.handleUnLock}>
              <Icon type="lock_open" />
              {formatMessage({ id: `${intlPrefix}.task.unlock` })}
            </span>)}
          {status === 'FAILED' && (
            <span onClick={this.handleRetry}>
              <Icon type="sync" />
              {formatMessage({ id: `${intlPrefix}.task.retry` })}
            </span>)}
        </div>
      </div>
    );
  }

  renderTaskDetail = () => {
    const { intl: { formatMessage }, instance } = this.props;
    const { task: {
      code,
      taskCode,
      description,
      seq,
      maxRetryCount,
      timeoutSeconds,
      timeoutPolicy,
      service,
      concurrentLimitPolicy,
      concurrentLimitNum,
      inputSchema,
    } } = this.state;
    const list = [{
      key: formatMessage({ id: `${intlPrefix}.task.code` }),
      value: code || taskCode,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.desc` }),
      value: description,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.seq` }),
      value: seq,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.concurrentlimit.policy` }),
      value: concurrentLimitPolicy,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.concurrentlimit.num` }),
      value: concurrentLimitNum,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.max-retry` }),
      value: maxRetryCount,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.timeout.time` }),
      value: timeoutSeconds,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.timeout.policy` }),
      value: timeoutPolicy,
    }, {
      key: formatMessage({ id: `${intlPrefix}.task.service` }),
      value: service,
    }];
    const input = {
      key: formatMessage({ id: `${intlPrefix}.task.input.title` }),
      value: inputSchema ? jsonFormat(JSON.parse(inputSchema)) : formatMessage({ id: `${intlPrefix}.json.nodata` }),
    };
    return (
      <div className="c7n-saga-task-detail">
        <div className="c7n-saga-task-detail-content">
          {list.map(({ key, value }, index) => <div key={`task-detail-${index}`}>{key}: {value}</div>)}
          {!instance && (
            <div>{input.key}:
              <div className="c7n-saga-detail-json">
                <pre style={{ maxHeight: '350px' }}><code>{input.value}</code></pre>
              </div>
            </div>)}
        </div>
      </div>
    );
  }

  renderJson() {
    const { jsonTitle, json } = this.state;
    const { intl: { formatMessage } } = this.props;
    return (
      <div className="c7n-saga-task-detail">
        <div className="c7n-saga-task-detail-title">
          {jsonTitle}
        </div>
        <div className="c7n-saga-task-detail-content">
          <div className="c7n-saga-detail-json">
            <pre style={{ maxHeight: '350px' }}>
              <code id="json">
                {json ? jsonFormat(JSON.parse(json)) : formatMessage({ id: `${intlPrefix}.json.nodata` })}
              </code>
            </pre>
          </div>
        </div>
      </div>
    );
  }

  render() {
    const { instance } = this.props;
    const { showDetail, jsonTitle, activeTab } = this.state;
    const input = this.circleWrapper('Input');
    const output = this.circleWrapper('Output');
    const clsNames = classnames('c7n-saga-img-detail-wrapper', {
      'c7n-saga-instance': !!instance,
    });
    return (
      <div className={clsNames}>
        <div className="c7n-saga-img" ref={this.taskImg}>
          {input}
          {this.renderContent()}
          {output}
        </div>
        {showDetail && (
          <div className="c7n-saga-img-detail" ref={this.taskDetail}>
            <Tabs activeKey={activeTab} onChange={this.handleTabChange}>
              {instance && (<TabPane tab={<FormattedMessage id={`${intlPrefix}.task.run.title`} />} key="run" />)}
              <TabPane tab={<FormattedMessage id={`${intlPrefix}.task.detail.title`} />} key="detail" />
            </Tabs>
            {instance && activeTab === 'run' ? this.renderTaskRunDetail() : this.renderTaskDetail()}
          </div>
        )}
        {jsonTitle && (
          <div className="c7n-saga-img-detail" ref={this.taskDetail}>
            {this.renderJson()}
          </div>
        )}
      </div>
    );
  }
}
