let treeData = null;
let nodeValues = [];
let selectedNode = null;

document.getElementById('nodeValue').addEventListener('input', function() {
    if (this.value < 0) {
        this.value = '';
    }
});

function addNode() {
    const nodeValue = document.getElementById('nodeValue').value;
    if (nodeValue) {
        if (selectedNode) {
            addChildNode(selectedNode, parseInt(nodeValue));
        } else {
            nodeValues.push(parseInt(nodeValue));
        }
        document.getElementById('nodeValue').value = '';
        selectedNode = null;
        renderTree();
    }
}

function deleteNode() {
    if (selectedNode) {
        nodeValues = nodeValues.filter(value => value !== selectedNode.value);
        treeData = buildTree(nodeValues);
        selectedNode = null;
        renderTree();
    }
}

function traverseTree() {
    const algorithm = document.getElementById('traversalAlgorithm').value;
    if (treeData) {
        let result = [];
        switch (algorithm) {
            case 'pre-order':
                result = preOrderTraversal(treeData);
                break;
            case 'in-order':
                result = inOrderTraversal(treeData);
                break;
            case 'post-order':
                result = postOrderTraversal(treeData);
                break;
        }
        document.getElementById('traversalResult').textContent = `Traversal result: ${result.join(', ')}`;
    }
}

function preOrderTraversal(node) {
    if (node == null) return [];
    return [node.value].concat(preOrderTraversal(node.left), preOrderTraversal(node.right));
}

function inOrderTraversal(node) {
    if (node == null) return [];
    return inOrderTraversal(node.left).concat(node.value, inOrderTraversal(node.right));
}

function postOrderTraversal(node) {
    if (node == null) return [];
    return postOrderTraversal(node.left).concat(postOrderTraversal(node.right), node.value);
}

function renderTree() {
    treeData = buildTree(nodeValues);

    const svg = d3.select("#tree").html("")
        .append("svg");

    const root = d3.hierarchy(treeData, d => (d ? [d.left, d.right].filter(x => x !== null) : []));
    const treeLayout = d3.tree().nodeSize([40, 40]);
    treeLayout(root);

    const width = root.descendants().reduce((max, node) => Math.max(max, node.x), 0) + 40;
    const height = root.descendants().reduce((max, node) => Math.max(max, node.y), 0) + 40;

    svg.attr("width", width)
        .attr("height", height);

    svg.selectAll('line')
        .data(root.links())
        .enter()
        .append('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', 'black');

    svg.selectAll('circle')
        .data(root.descendants())
        .enter()
        .append('circle')
        .attr('cx', d => d.x)
        .attr('cy', d => d.y)
        .attr('r', 20)
        .attr('fill', 'lightblue')
        .on('click', function(event, d) {
            selectedNode = d.data;
            d3.selectAll('circle').attr('stroke', null);
            d3.select(this).attr('stroke', 'red');
        });

    svg.selectAll('text')
        .data(root.descendants())
        .enter()
        .append('text')
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .text(d => d.data.value);
}

function buildTree(values) {
    if (values.length === 0) return null;

    let root = { value: values[0], left: null, right: null };

    for (let i = 1; i < values.length; i++) {
        let currentNode = root;
        let newNode = { value: values[i], left: null, right: null };

        while (true) {
            if (values[i] < currentNode.value) {
                if (currentNode.left === null) {
                    currentNode.left = newNode;
                    break;
                } else {
                    currentNode = currentNode.left;
                }
            } else {
                if (currentNode.right === null) {
                    currentNode.right = newNode;
                    break;
                } else {
                    currentNode = currentNode.right;
                }
            }
        }
    }

    return root;
}

function addChildNode(parent, value) {
    let newNode = { value: value, left: null, right: null };

    while (true) {
        if (value < parent.value) {
            if (parent.left === null) {
                parent.left = newNode;
                break;
            } else {
                parent = parent.left;
            }
        } else {
            if (parent.right === null) {
                parent.right = newNode;
                break;
            } else {
                parent = parent.right;
            }
        }
    }

    nodeValues.push(value);
}
