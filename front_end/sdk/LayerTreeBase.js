// Copyright 2016 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

/**
 * @interface
 */
export class Layer {
  /**
   * @return {string}
   */
  id() {
  }

  /**
   * @return {?string}
   */
  parentId() {
  }

  /**
   * @return {?Layer}
   */
  parent() {
  }

  /**
   * @return {boolean}
   */
  isRoot() {
  }

  /**
   * @return {!Array.<!Layer>}
   */
  children() {
  }

  /**
   * @param {!Layer} child
   */
  addChild(child) {
  }

  /**
   * @return {?SDK.DOMNode}
   */
  node() {
  }

  /**
   * @return {?SDK.DOMNode}
   */
  nodeForSelfOrAncestor() {
  }

  /**
   * @return {number}
   */
  offsetX() {
  }

  /**
   * @return {number}
   */
  offsetY() {
  }

  /**
   * @return {number}
   */
  width() {
  }

  /**
   * @return {number}
   */
  height() {
  }

  /**
   * @return {?Array.<number>}
   */
  transform() {
  }

  /**
   * @return {!Array.<number>}
   */
  quad() {
  }

  /**
   * @return {!Array.<number>}
   */
  anchorPoint() {
  }

  /**
   * @return {boolean}
   */
  invisible() {
  }

  /**
   * @return {number}
   */
  paintCount() {
  }

  /**
   * @return {?Protocol.DOM.Rect}
   */
  lastPaintRect() {
  }

  /**
   * @return {!Array.<!Protocol.LayerTree.ScrollRect>}
   */
  scrollRects() {
  }

  /**
   * @return {?Layer.StickyPositionConstraint}
   */
  stickyPositionConstraint() {
  }

  /**
   * @return {number}
   */
  gpuMemoryUsage() {
  }

  /**
   * @return {!Promise<!Array<string>>}
   */
  requestCompositingReasons() {
  }

  /**
   * @return {boolean}
   */
  drawsContent() {
  }

  /**
   * @return {!Array<!Promise<?SDK.SnapshotWithRect>>}
   */
  snapshots() {}
}

Layer.ScrollRectType = {
  NonFastScrollable: 'NonFastScrollable',
  TouchEventHandler: 'TouchEventHandler',
  WheelEventHandler: 'WheelEventHandler',
  RepaintsOnScroll: 'RepaintsOnScroll',
  MainThreadScrollingReason: 'MainThreadScrollingReason'
};

export class StickyPositionConstraint {
  /**
   * @param {?LayerTreeBase} layerTree
   * @param {!Protocol.LayerTree.StickyPositionConstraint} constraint
   * @struct
   */
  constructor(layerTree, constraint) {
    /** @type {!Protocol.DOM.Rect} */
    this._stickyBoxRect = constraint.stickyBoxRect;
    /** @type {!Protocol.DOM.Rect} */
    this._containingBlockRect = constraint.containingBlockRect;
    /** @type {?Layer} */
    this._nearestLayerShiftingStickyBox = null;
    if (layerTree && constraint.nearestLayerShiftingStickyBox) {
      this._nearestLayerShiftingStickyBox = layerTree.layerById(constraint.nearestLayerShiftingStickyBox);
    }

    /** @type {?Layer} */
    this._nearestLayerShiftingContainingBlock = null;
    if (layerTree && constraint.nearestLayerShiftingContainingBlock) {
      this._nearestLayerShiftingContainingBlock = layerTree.layerById(constraint.nearestLayerShiftingContainingBlock);
    }
  }

  /**
   * @return {!Protocol.DOM.Rect}
   */
  stickyBoxRect() {
    return this._stickyBoxRect;
  }

  /**
   * @return {!Protocol.DOM.Rect}
   */
  containingBlockRect() {
    return this._containingBlockRect;
  }

  /**
   * @return {?Layer}
   */
  nearestLayerShiftingStickyBox() {
    return this._nearestLayerShiftingStickyBox;
  }

  /**
   * @return {?Layer}
   */
  nearestLayerShiftingContainingBlock() {
    return this._nearestLayerShiftingContainingBlock;
  }
}

/**
 * @unrestricted
 */
export default class LayerTreeBase {
  /**
   * @param {?SDK.Target} target
   */
  constructor(target) {
    this._target = target;
    this._domModel = target ? target.model(SDK.DOMModel) : null;
    this._layersById = {};
    this._root = null;
    this._contentRoot = null;
    /** @type {!Map<number, ?SDK.DOMNode>} */
    this._backendNodeIdToNode = new Map();
  }

  /**
   * @return {?SDK.Target}
   */
  target() {
    return this._target;
  }

  /**
   * @return {?Layer}
   */
  root() {
    return this._root;
  }

  /**
   * @param {?Layer} root
   * @protected
   */
  setRoot(root) {
    this._root = root;
  }

  /**
   * @return {?Layer}
   */
  contentRoot() {
    return this._contentRoot;
  }

  /**
   * @param {?Layer} contentRoot
   * @protected
   */
  setContentRoot(contentRoot) {
    this._contentRoot = contentRoot;
  }

  /**
   * @param {function(!Layer)} callback
   * @param {?Layer=} root
   * @return {boolean}
   */
  forEachLayer(callback, root) {
    if (!root) {
      root = this.root();
      if (!root) {
        return false;
      }
    }
    return callback(root) || root.children().some(this.forEachLayer.bind(this, callback));
  }

  /**
   * @param {string} id
   * @return {?Layer}
   */
  layerById(id) {
    return this._layersById[id] || null;
  }

  /**
   * @param {!Set<number>} requestedNodeIds
   * @return {!Promise}
   */
  async resolveBackendNodeIds(requestedNodeIds) {
    if (!requestedNodeIds.size || !this._domModel) {
      return;
    }

    const nodesMap = await this._domModel.pushNodesByBackendIdsToFrontend(requestedNodeIds);

    if (!nodesMap) {
      return;
    }
    for (const nodeId of nodesMap.keysArray()) {
      this._backendNodeIdToNode.set(nodeId, nodesMap.get(nodeId) || null);
    }
  }

  /**
   * @return {!Map<number, ?SDK.DOMNode>}
   */
  backendNodeIdToNode() {
    return this._backendNodeIdToNode;
  }

  /**
   * @param {!{width: number, height: number}} viewportSize
   */
  setViewportSize(viewportSize) {
    this._viewportSize = viewportSize;
  }

  /**
   * @return {!{width: number, height: number}|undefined}
   */
  viewportSize() {
    return this._viewportSize;
  }

  /**
   * @param {number} id
   * @return {?SDK.DOMNode}
   */
  _nodeForId(id) {
    return this._domModel ? this._domModel.nodeForId(id) : null;
  }
}

/* Legacy exported object */
self.SDK = self.SDK || {};

/* Legacy exported object */
SDK = SDK || {};

/** @interface */
SDK.Layer = Layer;

/** @constructor */
SDK.LayerTreeBase = LayerTreeBase;

/** @constructor */
SDK.Layer.StickyPositionConstraint = StickyPositionConstraint;

/** @typedef {!{
        rect: !Protocol.DOM.Rect,
        snapshot: !SDK.PaintProfilerSnapshot
    }}
*/
SDK.SnapshotWithRect;
