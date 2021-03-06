import React from 'react';
import { Route, Switch, } from 'react-router-dom';
import { asyncRouter, nomatch } from 'choerodon-front-boot';

const index = asyncRouter(() => (import('./APITest')), () => import('../../../stores/global/api-test'));
const detail = asyncRouter(() => import('./APIDetail'));

const Index = ({ match }) => (
  <Switch>
    <Route exact path={match.url} component={index} />
    <Route path={`${match.url}/detail/:controller/:service/:operationId/:version`} component={detail} />
    <Route path={'*'} component={nomatch} />
  </Switch>
);

export default Index;
