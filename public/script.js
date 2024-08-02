let treeData = null;
let nodeValues = [];
let selectedNode = null;
let history = []; // History of trees with names
let draggingNode = null;

// Load history from localStorage if available
window.onload = () => {
    const savedHistory = localStorage.getItem('treeHistory');
    if (savedHistory) {
        history = JSON.parse(savedHistory);
        updateHistoryDropdown();
    }
};

document.getElementById('nodeValue').addEventListener('input', function() {
    if (this.value < 0) {
        this.value = '';
    }
});

function addNode() {
    const nodeLabel = document.getElementById('nodeLabel').value;
    const nodeValue = document.getElementById('nodeValue').value;
    if (nodeValue) {
        nodeValues.push({ label: nodeLabel, value: parseInt(nodeValue) });
        document.getElementById('nodeLabel').value = '';
        document.getElementById('nodeValue').value = '';
        selectedNode = null;
        treeData = buildTree(nodeValues);
        renderTree();
        updateStatistics();
    }
}

function deleteNode() {
    if (selectedNode) {
        nodeValues = nodeValues.filter(node => node.value !== selectedNode.value);
        selectedNode = null;
        treeData = buildTree(nodeValues);
        renderTree();
        updateStatistics();
        document.getElementById('traversalResult').textContent = '';
        document.getElementById('subtreeStats').innerText = '';
        document.getElementById('subtreeWarning').classList.add('hidden');
    } else {
        alert('Please select a node to delete.');
    }
}// Function to handle collapsible sidebar
document.querySelectorAll('.collapsible').forEach(button => {
    button.addEventListener('click', function() {
        const content = this.nextElementSibling;
        if (content.style.display === "block") {
            content.style.display = "none";
        } else {
            content.style.display = "block";
        }
    });
});

// Function to show notifications
function showNotification(message) {
    const notificationElement = document.getElementById('saveLoadNotifications');
    notificationElement.textContent = message;
    setTimeout(() => {
        notificationElement.textContent = '';
    }, 3000);
}


// Save Tree function
function saveTree() {
    const treeName = prompt('Enter a name for the tree:');
    if (treeName && treeData) {
        history.push({ name: treeName, data: treeData });
        localStorage.setItem('treeHistory', JSON.stringify(history));
        showNotification('Tree saved successfully!');
        updateHistoryDropdown();
    } else {
        showNotification('No tree data available to save or name is empty.');
    }
}

// Load Tree function
function loadTree() {
    const selectedName = document.getElementById('historyDropdown').value;
    const tree = history.find(h => h.name === selectedName);
    if (tree) {
        treeData = tree.data;
        nodeValues = extractNodeValues(treeData);
        renderTree();
        updateStatistics();
        showNotification('Tree loaded successfully!');
    } else {
        showNotification('No saved tree found.');
    }
}


function extractNodeValues(node, values = []) {
    if (node) {
        values.push({ label: node.label, value: node.value });
        extractNodeValues(node.left, values);
        extractNodeValues(node.right, values);
    }
    return values;
}

function buildTree(values) {
    if (values.length === 0) return null;

    values.sort((a, b) => a.value - b.value);

    function buildBalancedBST(start, end) {
        if (start > end) return null;

        const mid = Math.floor((start + end) / 2);
        const node = { value: values[mid].value, label: values[mid].label, left: null, right: null };
        node.left = buildBalancedBST(start, mid - 1);
        node.right = buildBalancedBST(mid + 1, end);
        return node;
    }

    return buildBalancedBST(0, values.length - 1);
}

function traverseTree(stepByStep = false) {
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
        if (result.length === 0) {
            console.warn('Traversal resulted in an empty list. Check tree structure and traversal functions.');
        } else {
            console.log('Traversal result:', result.map(node => node.label || node.value));
        }

        if (stepByStep) {
            highlightNodesStepByStep(result);
        } else {
            document.getElementById('traversalResult').textContent = `Traversal result: ${result.map(node => node.label || node.value).join(', ')}`;
        }
    } else {
        console.warn('No tree data available for traversal.');
    }
}

function preOrderTraversal(node) {
    if (node == null) return [];
    console.log('Visiting node:', node.value);
    return [node].concat(preOrderTraversal(node.left), preOrderTraversal(node.right));
}

function inOrderTraversal(node) {
    if (node == null) return [];
    return inOrderTraversal(node.left).concat(node, inOrderTraversal(node.right));
}

function postOrderTraversal(node) {
    if (node == null) return [];
    return postOrderTraversal(node.left).concat(postOrderTraversal(node.right), node);
}

function renderTree() {
    if (!treeData) return;

    const svgContainer = d3.select("#tree").html("")
        .append("svg")
        .attr("width", "100%")
        .attr("height", "100%");

    const margin = { top: 20, right: 40, bottom: 20, left: 40 };
    const width = document.getElementById('tree').clientWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = svgContainer
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const root = d3.hierarchy(treeData, d => (d ? [d.left, d.right].filter(x => x !== null) : []));
    const treeLayout = d3.tree().size([width, height]);
    treeLayout(root);

    const link = svg.selectAll('line')
        .data(root.links())
        .enter()
        .append('line')
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y)
        .attr('stroke', 'black');

    const node = svg.selectAll('g.node')
        .data(root.descendants())
        .enter()
        .append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.x},${d.y})`)
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    node.append('circle')
        .attr('r', 20)
        .attr('fill', 'lightblue')
        .on('click', function(event, d) {
            selectedNode = d.data;
            d3.selectAll('circle').attr('stroke', null);
            d3.select(this).attr('stroke', 'red');
        });

    node.append('text')
        .attr('dy', 4)
        .attr('text-anchor', 'middle')
        .text(d => d.data.label || d.data.value);
}

function dragstarted(event, d) {
    draggingNode = d;
    d3.select(this).select('circle').attr('stroke', 'orange');
}

function dragged(event, d) {
    d.x = event.x;
    d.y = event.y;
    d3.select(this).attr('transform', `translate(${d.x},${d.y})`);
    d3.selectAll('line')
        .attr('x1', l => l.source.x)
        .attr('y1', l => l.source.y)
        .attr('x2', l => l.target.x)
        .attr('y2', l => l.target.y);
}

function dragended(event, d) {
    d3.select(this).select('circle').attr('stroke', 'black');
    draggingNode = null;
}

function highlightNodesStepByStep(nodes) {
    const nodeElems = d3.selectAll('g.node');
    let index = 0;

    function highlightStep() {
        if (index < nodes.length) {
            nodeElems.select('circle')
                .attr('fill', (d, i) => d.data === nodes[index] ? 'yellow' : 'lightblue');
            index++;
            setTimeout(highlightStep, 1000); // Adjust delay as needed
        } else {
            // Reset all nodes to original color after traversal
            nodeElems.select('circle').attr('fill', 'lightblue');
        }
    }

    highlightStep();
}

function updateStatistics() {
    const stats = calculateStatistics(treeData);
    document.getElementById('nodeStats').innerText = `Total Nodes: ${stats.totalNodes}, Leaf Nodes: ${stats.leafNodes}, Depth: ${stats.depth}`;
}

function calculateStatistics(node) {
    if (node === null) return { totalNodes: 0, leafNodes: 0, depth: 0 };

    const leftStats = calculateStatistics(node.left);
    const rightStats = calculateStatistics(node.right);

    const totalNodes = 1 + leftStats.totalNodes + rightStats.totalNodes;
    const leafNodes = (node.left === null && node.right === null) ? 1 : leftStats.leafNodes + rightStats.leafNodes;
    const depth = 1 + Math.max(leftStats.depth, rightStats.depth);

    return { totalNodes, leafNodes, depth };
}

function analyzeSubtree() {
    if (selectedNode) {
        document.getElementById('subtreeWarning').classList.add('hidden');
        const stats = calculateStatistics(selectedNode);
        document.getElementById('subtreeStats').innerText = `Subtree - Total Nodes: ${stats.totalNodes}, Leaf Nodes: ${stats.leafNodes}, Depth: ${stats.depth}`;
    } else {
        document.getElementById('subtreeWarning').classList.remove('hidden');
    }
}

function updateHistoryDropdown() {
    const historyDropdown = document.getElementById('historyDropdown');
    historyDropdown.innerHTML = '<option value="">Select Tree</option>';
    history.forEach(h => {
        const option = document.createElement('option');
        option.value = h.name;
        option.textContent = h.name;
        historyDropdown.appendChild(option);
    });
}
