import { TById } from 'redux/mtproto';
import { IReducer } from 'redux/IStore';
import { pipe as P, map, contains, append, path, dissoc, assoc,
  unless, reduce, prop, propEq, curry } from 'ramda';

const convolveReducers = payload => (state, reducer) => reducer(state, payload);

export const reduceSequence = <S, P>(...reducers): IReducer<S, P> =>
  (state, payload) => reducers.reduce(convolveReducers(payload), state);

export const whenNot = (pred, change) =>
  (state, data) =>
    unless(
      pred(data),
      change(data),
    )(state);

export const whenNotC = curry( (pred, change, data, state) =>
  unless(
    pred(data),
    change(data),
  )(state) );

export interface IStoreList<T> {
  ids: number[];
  byId: TById<T>;
}

export const isEmptyList = <T>(storeField: IStoreList<T>) => storeField.ids.length === 0;

type IGetReduce = <S, PL, G>(getter: (pl: PL) => G, reducer: IReducer<S, G>) => IReducer<S, PL>;

export const getReduce: IGetReduce = (getter, reducer) => (state, payload) =>
  P(getter, reduce(reducer, state))(payload);

export const getListOf = (field: string) => path([field, 'list']);

export const appendNew = whenNot(contains, append);

export const changePayload = (func, reducer) =>
  (state, payload) => reducer(state, func(payload));

const getId = prop('id');

const addNewId = changePayload(getId, appendNew);

export const newIdsFromList = listGetter => getReduce(listGetter, addNewId);

const idPair = (e): [number, any] => [ e.id, dissoc('id', e) ];

const addChangedProp = <V>(state: TById<V>, [id, val]: IIdPair<V>): TById<V> =>
  unless<typeof state, typeof state>(
    propEq(id, val),
    assoc(id, val),
  )(state);

type IIdPair<Value> = [number, Value];

type IIdPairList<Value> = Array<IIdPair<Value>>;

type ITransformer = <F, G>(payload: G) => IIdPairList<F>;

export const changeReducer = <G>(transformer: ITransformer) =>
  <F, PL>(vectorGetter: (payload: PL) => G) =>
    getReduce<TById<F>, PL, IIdPairList<F>>(
      P<PL, G, IIdPairList<F>>(vectorGetter, transformer),
      addChangedProp);

// TODO: strict types
const adaptFieldVector = map<any, IIdPair<any>>(idPair);

export const fieldListToMap = changeReducer(adaptFieldVector);